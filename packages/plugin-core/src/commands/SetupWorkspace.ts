import { DendronError, DVault } from "@dendronhq/common-all";
import { resolveTilde, vault2Path } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import vscode from "vscode";
import { DENDRON_COMMANDS, DENDRON_WS_NAME } from "../constants";
import { Snippets, WorkspaceConfig } from "../settings";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {
  rootDirRaw: string;
  vault?: DVault;
  skipOpenWs?: boolean;
  emptyWs?: boolean;
  /**
   * override prompts
   */
  skipConfirmation?: boolean;
  initType?: InitializeType;
};

type CommandInput = {
  rootDirRaw: string;
  emptyWs: boolean;
  initType?: InitializeType;
};

type CommandOutput = DVault[];

export { CommandOpts as SetupWorkspaceOpts };

export enum InitializeType {
  "TUTORIAL_NOTES",
  "EMPTY",
  "TEMPLATE",
}

export class SetupWorkspaceCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.INIT_WS.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    const rootDirRaw = await VSCodeUtils.gatherFolderPath({
      default: path.join(resolveTilde("~"), "Dendron"),
    });
    if (_.isUndefined(rootDirRaw)) {
      return;
    }
    return { rootDirRaw, emptyWs: true };
  }

  handleExistingRoot = async ({
    rootDir,
    skipConfirmation,
  }: {
    rootDir: string;
    skipConfirmation?: boolean;
  }): Promise<boolean> => {
    if (fs.existsSync(rootDir) && !skipConfirmation) {
      const options = {
        delete: { msg: "delete existing folder", alias: "d" },
        abort: { msg: "abort current operation", alias: "a" },
        continue: {
          msg: "initialize workspace into current folder",
          alias: "c",
        },
      };
      const resp = await vscode.window.showInputBox({
        prompt: `${rootDir} exists. Please specify the next action. Your options: ${_.map(
          options,
          (v, k) => {
            return `(${k}: ${v.msg})`;
          }
        ).join(", ")}`,
        ignoreFocusOut: true,
        value: "continue",
        validateInput: async (value: string) => {
          if (!_.includes(_.keys(options), value.toLowerCase())) {
            return `not valid input. valid inputs: ${_.keys(options).join(
              ", "
            )}`;
          }
          return null;
        },
      });

      if (resp === "abort") {
        vscode.window.showInformationMessage(
          "did not initialize dendron workspace"
        );
        return false;
      } else if (resp === "delete") {
        try {
          fs.removeSync(rootDir);
          return true;
        } catch (err) {
          this.L.error(JSON.stringify(err));
          vscode.window.showErrorMessage(
            `error removing ${rootDir}. please check that it's not currently open`
          );
          return false;
        }
      }
      return true;
    }
    return true;
  };

  handleInitializeType = async ({
    initType,
  }: {
    initType: InitializeType;
    rootDir: string;
  }): Promise<DVault[]> => {
    switch (initType) {
      // case InitializeType.TEMPLATE:
      //   // TDOO:
      //   const remote =
      //     "git@github.com:dendronhq/dendron-workspace-template.git";
      //   await GitV2.clone(`${remote} ${rootDir}`);
      //   const config = DConfig.getOrCreate(rootDir);
      //   const vaults = await Promise.all(
      //     config.vaults.map(async (ent) => {
      //       if (!ent.remote) {
      //         throw new DendronError({ message: "no remote found for vault" });
      //       }
      //       const { url } = ent.remote;
      //       await GitV2.clone(`${url} ${ent.fsPath}`, { cwd: rootDir });
      //       const vpath = resolvePath(ent.fsPath, rootDir);
      //       path.relative(rootDir, ent.fsPath)
      //       return await new VaultAddCommand().execute({
      //         vpath,
      //         vpathOrig: ent.fsPath,
      //       });
      //     })
      //   );
      //   return _.map(vaults, (ent) => ent.vault);
      default:
        throw new DendronError({
          message: `init type ${initType} not supported`,
        });
    }
  };

  async execute(opts: CommandOpts): Promise<DVault[]> {
    const ctx = "SetupWorkspaceCommand extends BaseCommand";
    const ws = DendronWorkspace.instance();
    const { rootDirRaw: rootDir, skipOpenWs, emptyWs, initType } = _.defaults(
      opts,
      {
        skipOpenWs: false,
        emptyWs: false,
      }
    );
    ws.L.info({ ctx, rootDir, skipOpenWs });

    if (
      !(await this.handleExistingRoot({
        rootDir,
        skipConfirmation: opts.skipConfirmation,
      }))
    ) {
      return [];
    }

    if (initType === InitializeType.TEMPLATE) {
      return this.handleInitializeType({ initType, rootDir });
    }

    // create vault
    const vaultPath = opts.vault?.fsPath || "vault";
    const vaults = [{ fsPath: vaultPath }];
    await WorkspaceService.createWorkspace({ vaults, wsRoot: rootDir });
    const vpath = vault2Path({ vault: vaults[0], wsRoot: rootDir });

    const dendronWSTemplate = VSCodeUtils.joinPath(
      ws.extensionAssetsDir,
      "dendron-ws"
    );
    // copy over jekyll config
    const dendronJekyll = VSCodeUtils.joinPath(ws.extensionAssetsDir, "jekyll");
    fs.copySync(path.join(dendronJekyll.fsPath), path.join(rootDir, "docs"));

    // copy over notes
    if (!emptyWs) {
      fs.copySync(path.join(dendronWSTemplate.fsPath, "vault"), vpath);
    }
    // write workspace defaults
    WorkspaceConfig.write(rootDir);

    // write snippets
    const vscodeDir = path.join(vpath, ".vscode");
    Snippets.create(vscodeDir);

    if (!opts.skipOpenWs) {
      vscode.window.showInformationMessage("opening dendron workspace");
      VSCodeUtils.openWS(
        vscode.Uri.file(path.join(rootDir, DENDRON_WS_NAME)).fsPath
      );
      return vaults;
    }
    return vaults;
  }
}
