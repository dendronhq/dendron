import {
  DVault,
  DWorkspace,
  VaultRemoteSource,
  VaultUtils,
  WorkspaceSettings,
  WorkspaceType,
} from "@dendronhq/common-all";
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
import { commands, ProgressLocation, QuickPickItem, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS, DENDRON_REMOTE_VAULTS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { DendronExtension, getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {
  type: VaultRemoteSource;
  path: string;
  pathRemote?: string;
  name?: string;
};

type CommandOutput = { vaults: DVault[] };

export { CommandOpts as VaultAddCommandOpts };

type SourceQuickPickEntry = QuickPickItem & { src: string };

export class VaultAddCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.VAULT_ADD.key;

  generateRemoteEntries = (): SourceQuickPickEntry[] => {
    return (
      DENDRON_REMOTE_VAULTS.map(({ name: label, description, data: src }) => {
        return { label, description, src };
      }) as SourceQuickPickEntry[]
    ).concat([
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
    let sourcePath: string;
    let sourceName: string | undefined;
    const localVaultPathPlaceholder = "vault2";
    if (!vaultRemoteSource) {
      return;
    }
    const sourceType = vaultRemoteSource.label as VaultRemoteSource;
    if (sourceType === "remote") {
      // eslint-disable-next-line  no-async-promise-executor
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
          const sourceRemotePath = selected.src;
          const path2Vault =
            selected.label === "custom"
              ? GitUtils.getRepoNameFromURL(sourceRemotePath)
              : selected.label;
          const placeHolder = path2Vault;

          const out = await VSCodeUtils.showInputBox({
            prompt: "Path to your new vault (relative to your workspace root)",
            placeHolder: localVaultPathPlaceholder,
            value: path2Vault,
          });
          if (PickerUtilsV2.isInputEmpty(out)) {
            resolve(undefined);
          }
          sourcePath = out!;

          sourceName = await VSCodeUtils.showInputBox({
            prompt: "Name of new vault (optional, press enter to skip)",
            value: placeHolder,
          });
          qp.hide();
          return resolve({
            type: sourceType!,
            name: sourceName,
            path: sourcePath,
            pathRemote: sourceRemotePath,
          });
        });
        qp.show();
      });
      return out;
    } else {
      const out = await VSCodeUtils.showInputBox({
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

  async handleRemoteRepo(
    opts: CommandOpts
  ): Promise<{ vaults: DVault[]; workspace?: DWorkspace }> {
    const { vaults, workspace } = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Adding remote vault",
        cancellable: false,
      },
      async (progress) => {
        progress.report({
          message: "cloning repo",
        });
        const baseDir = getDWorkspace().wsRoot;
        const git = simpleGit({ baseDir });
        await git.clone(opts.pathRemote!, opts.path);
        const { vaults, workspace } = GitUtils.getVaultsFromRepo({
          repoPath: path.join(baseDir, opts.path),
          wsRoot: getDWorkspace().wsRoot,
          repoUrl: opts.pathRemote!,
        });
        if (_.size(vaults) === 1 && opts.name) {
          vaults[0].name = opts.name;
        }
        // add all vaults
        progress.report({
          message: "adding vault",
        });
        const wsRoot = getDWorkspace().wsRoot;
        const wsService = new WorkspaceService({ wsRoot });

        if (workspace) {
          await wsService.addWorkspace({ workspace });
          await this.addWorkspaceToWorkspace(workspace);
        } else {
          await _.reduce(
            vaults,
            async (resp: any, vault: DVault) => {
              await resp;
              await wsService.createVault({ vault });
              return this.addVaultToWorkspace(vault);
            },
            Promise.resolve()
          );
        }
        return { vaults, workspace };
      }
    );
    return { vaults, workspace };
  }

  async addWorkspaceToWorkspace(workspace: DWorkspace) {
    const wsRoot = getDWorkspace().wsRoot;
    const vaults = workspace.vaults;

    await _.reduce(
      vaults,
      async (resp: any, vault: DVault) => {
        await resp;
        return this.addVaultToWorkspace(vault);
      },
      Promise.resolve()
    );
    // add to gitignore
    const gitIgnore = path.join(wsRoot, ".gitignore");
    if (fs.existsSync(gitIgnore)) {
      fs.appendFileSync(gitIgnore, "\n" + workspace.name + "\n", {
        encoding: "utf8",
      });
    }

    const gitIgnoreInsideVault = path.join(
      wsRoot,
      workspace.name,
      ".gitignore"
    );
    fs.ensureFileSync(gitIgnoreInsideVault);
    fs.appendFileSync(gitIgnoreInsideVault, "\n.dendron.cache.*", {
      encoding: "utf8",
    });
  }

  async addVaultToWorkspace(vault: DVault) {
    if (getDWorkspace().type === WorkspaceType.NATIVE) return;
    const wsRoot = getDWorkspace().wsRoot;

    // workspace file
    const wsPath = DendronExtension.workspaceFile().fsPath;
    let out = (await readJSONWithComments(wsPath)) as WorkspaceSettings;
    if (
      !_.find(out.folders, (ent) => ent.path === VaultUtils.getRelPath(vault))
    ) {
      const vault2Folder = VaultUtils.toWorkspaceFolder(vault);
      const folders = [vault2Folder].concat(out.folders);
      out = assignJSONWithComment({ folders }, out);
      writeJSONWithComments(wsPath, out);
    }

    // check for .gitignore
    const gitIgnore = path.join(wsRoot, ".gitignore");
    if (fs.existsSync(gitIgnore)) {
      fs.appendFileSync(gitIgnore, "\n" + vault.fsPath + "\n", {
        encoding: "utf8",
      });
    }
    //check for .gitignore inside vault
    const gitIgnoreInsideVault = path.join(wsRoot, vault.fsPath, ".gitignore");
    fs.ensureFileSync(gitIgnoreInsideVault);
    fs.appendFileSync(gitIgnoreInsideVault, "\n.dendron.cache.*", {
      encoding: "utf8",
    });
    return;
  }

  /**
   * Returns all vaults added
   * @param opts
   * @returns
   */
  async execute(opts: CommandOpts) {
    const ctx = "VaultAdd";
    let vaults: DVault[] = [];
    Logger.info({ ctx, msg: "enter", opts });
    if (opts.type === "remote") {
      ({ vaults } = await this.handleRemoteRepo(opts));
    } else {
      const wsRoot = getDWorkspace().wsRoot;
      const fsPath = VaultUtils.normVaultPath({
        vault: { fsPath: opts.path },
        wsRoot,
      });
      const vault: DVault = { fsPath };
      if (opts.name) {
        vault.name = opts.name;
      }
      const wsService = new WorkspaceService({ wsRoot });
      await wsService.createVault({ vault });
      await this.addVaultToWorkspace(vault);
      vaults = [vault];
    }
    window.showInformationMessage("finished adding vault");
    await commands.executeCommand("workbench.action.reloadWindow");
    return { vaults };
  }
}
