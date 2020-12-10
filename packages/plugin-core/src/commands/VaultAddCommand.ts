import { DVault, getStage, VaultUtils } from "@dendronhq/common-all";
import {
  assignJSONWithComment,
  GitUtils,
  readJSONWithComments,
  simpleGit,
  writeJSONWithComments,
} from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { commands, QuickPickItem, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS, DENDRON_REMOTE_VAULTS } from "../constants";
import { Logger } from "../logger";
import { WorkspaceFolderRaw, WorkspaceSettings } from "../types";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {
  type: VaultRemoteSource;
  path: string;
  name?: string;
};

type CommandOutput = { vaults: DVault[] };
export type VaultRemoteSource = "local" | "remote";

export { CommandOpts as VaultAddCommandOpts };

type SourceQuickPickEntry = QuickPickItem & { src: string };
export class VaultAddCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.VAULT_ADD.key;

  generateRemoteEntries = (): SourceQuickPickEntry[] => {
    return (DENDRON_REMOTE_VAULTS.map(
      ({ name: label, description, data: src }) => {
        return { label, description, src };
      }
    ) as SourceQuickPickEntry[]).concat([
      {
        label: "custom",
        description: "custom endpoint",
        alwaysShow: true,
        src: "",
      },
    ]);
  };

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const vaultRemoteSource = await VSCodeUtils.showQuickPick([
      { label: "local", picked: true },
      { label: "remote" },
    ]);
    let sourceType: VaultRemoteSource | undefined;
    let sourcePath: string;
    let sourceName: string | undefined;
    let localVaultPathPlaceholder = "vault2";
    if (!vaultRemoteSource) {
      return;
    }
    sourceType = vaultRemoteSource.label as VaultRemoteSource;
    if (sourceType === "remote") {
      const out = new Promise<CommandOpts | undefined>(async (resolve) => {
        const qp = VSCodeUtils.createQuickPick<SourceQuickPickEntry>();
        qp.ignoreFocusOut = true;
        qp.placeholder = "choose a preset or enter a custom git endpoint";
        qp.items = this.generateRemoteEntries();
        qp.onDidAccept(async () => {
          const value = qp.value;
          const selected = qp.selectedItems[0];
          if (selected.label === "custom") {
            if (PickerUtilsV2.isInputEmpty(value)) {
              return window.showInformationMessage("please enter an endpoint");
            }
            selected.src = qp.value;
          }
          sourcePath = selected.src;
          sourceName = await VSCodeUtils.showInputBox({
            prompt: "Name of new vault (optional, press enter to skip)",
          });
          window.showInformationMessage(JSON.stringify(selected));
          qp.hide();
          return resolve({
            type: sourceType!,
            name: sourceName,
            path: sourcePath,
          });
        });
        qp.show();
      });
      return out;
    } else {
      let out = await VSCodeUtils.showInputBox({
        prompt: "Path to your new vault (relative to your workspace root)",
        placeHolder: localVaultPathPlaceholder,
      });
      if (PickerUtilsV2.isInputEmpty(out)) return;
      sourcePath = out!;
    }
    sourceName = await VSCodeUtils.showInputBox({
      prompt: "Name of new vault (optional, press enter to skip)",
    });
    return {
      type: sourceType,
      name: sourceName,
      path: sourcePath,
    };
  }

  async handleRemoteRepo(opts: CommandOpts) {
    const repoDir = DendronWorkspace.instance().repoDir;
    fs.ensureDirSync(repoDir);
    // clone
    const git = simpleGit({ baseDir: repoDir });
    await git.clone(opts.path);
    const repoName = GitUtils.getRepoNameFromURL(opts.path);
    const repoPath = path.join(repoDir, repoName);
    const { vaults } = GitUtils.getVaultsFromRepo({
      repoPath,
      wsRoot: DendronWorkspace.wsRoot(),
      repoUrl: opts.path,
    });
    await _.reduce<DVault, Promise<void>>(
      vaults,
      async (resp, vault: DVault) => {
        await resp;
        return this.addVaultToWorkspace(vault);
      },
      Promise.resolve()
    );
    return vaults;
  }

  async addVaultToWorkspace(vault: DVault) {
    const wsRoot = DendronWorkspace.wsRoot();
    const wsService = new WorkspaceService({ wsRoot });
    await wsService.createVault({ vault });

    // workspace file
    const wsPath = DendronWorkspace.workspaceFile().fsPath;
    let out = (await readJSONWithComments(wsPath)) as WorkspaceSettings;
    if (!_.find(out.folders, (ent) => ent.path === vault.fsPath)) {
      const vault2Folder: WorkspaceFolderRaw = { path: vault.fsPath };
      if (vault.name) {
        vault2Folder.name = vault.name;
      }
      const folders = out.folders.concat(vault2Folder);
      out = assignJSONWithComment({ folders }, out);
      writeJSONWithComments(wsPath, out);
    }

    // check for .gitignore
    const gitIgnore = path.join(wsRoot, ".gitignore");
    if (fs.existsSync(gitIgnore)) {
      fs.appendFileSync(gitIgnore, vault.fsPath + "\n", { encoding: "utf8" });
    }
    return;
  }

  async execute(opts: CommandOpts) {
    const ctx = "VaultAdd";
    let vaults: DVault[] = [];
    Logger.info({ ctx, msg: "enter", opts });
    if (opts.type === "remote") {
      vaults = await this.handleRemoteRepo(opts);
    } else {
      const wsRoot = DendronWorkspace.wsRoot();
      const fsPath = VaultUtils.normVaultPath({
        vault: { fsPath: opts.path },
        wsRoot,
      });
      const vault: DVault = { fsPath };
      if (opts.name) {
        vault.name = opts.name;
      }
      await this.addVaultToWorkspace(vault);
      vaults = [vault];
    }
    window.showInformationMessage("finished adding vault");
    if (getStage() !== "test") {
      await commands.executeCommand("workbench.action.reloadWindow");
    }
    return { vaults };
  }
}
