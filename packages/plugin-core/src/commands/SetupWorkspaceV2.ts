import { DVault } from "@dendronhq/common-all";
import { resolvePath, resolveTilde } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import vscode from "vscode";
import { DENDRON_COMMANDS, DENDRON_WS_NAME, GLOBAL_STATE } from "../constants";
import { Logger } from "../logger";
import { WorkspaceConfig } from "../settings";
import { VSCodeUtils } from "../utils";
import { getGlobalState, getWS } from "../workspace";
import { BasicCommand } from "./base";
import { InitializeType } from "./SetupWorkspace";

type CommandOpts = {
  wsRoot: string;
  vaults?: DVault[];
  skipOpenWs?: boolean;
  skipConfirmation?: boolean;
  initType: InitializeType;
};
type CommandInput = {
  wsRoot: string;
  initType: InitializeType;
};
type CommandOutput = DVault[];

export class SetupWorkspaceCommandV2 extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.INIT_WS_V2.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    const wsRoot = await VSCodeUtils.gatherFolderPath({
      default: path.join(resolveTilde("~"), "Dendron"),
    });
    if (_.isUndefined(wsRoot)) {
      return;
    }

    // if first workspace, don't prompt
    const firstWs = _.isUndefined(
      getGlobalState(GLOBAL_STATE.DENDRON_FIRST_WS)
    );
    if (firstWs) {
      return { wsRoot, initType: InitializeType.TUTORIAL_NOTES };
    }

    const options = [
      "initialize with dendron tutorial notes",
      "initialize empty repository",
    ];
    // when("betaFeatures", () => {
    //   options.push("initialize from git");
    // });

    const initializeChoice = await VSCodeUtils.showQuickPick(options, {
      placeHolder: "initialize with dendron tutorial notes",
      ignoreFocusOut: true,
    });
    if (!initializeChoice) {
      return;
    }
    const initType = options.indexOf(initializeChoice) as InitializeType;
    return { wsRoot, initType };
  }

  handleExistingRoot = async ({
    wsRoot,
    skipConfirmation,
  }: {
    wsRoot: string;
    skipConfirmation?: boolean;
  }): Promise<boolean> => {
    if (fs.existsSync(wsRoot) && !skipConfirmation) {
      const options = {
        delete: { msg: "delete existing folder", alias: "d" },
        abort: { msg: "abort current operation", alias: "a" },
        continue: {
          msg: "initialize workspace into current folder",
          alias: "c",
        },
      };
      const resp = await vscode.window.showInputBox({
        prompt: `${wsRoot} exists. Please specify the next action. Your options: ${_.map(
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
          fs.removeSync(wsRoot);
          return true;
        } catch (err) {
          this.L.error(JSON.stringify(err));
          vscode.window.showErrorMessage(
            `error removing ${wsRoot}. please check that it's not currently open`
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
    wsRoot,
    vaults,
  }: {
    initType: InitializeType;
    wsRoot: string;
    vaults?: DVault[];
  }) => {
    vaults = vaults || [{ fsPath: "vault-main" }];
    const _ws = await WorkspaceService.createWorkspaceV2({ wsRoot, vaults });

    // setup publishing
    const dendronJekyll = vscode.Uri.joinPath(
      getWS().extensionAssetsDir,
      "jekyll"
    );
    fs.copySync(path.join(dendronJekyll.fsPath), path.join(wsRoot, "docs"));

    // write workspace defaults
    WorkspaceConfig.write(_ws.dendronRoot);

    // setup tutorial notes
    if (initType === InitializeType.TUTORIAL_NOTES) {
      const dendronWSTemplate = vscode.Uri.joinPath(
        getWS().extensionAssetsDir,
        "dendron-ws"
      );
      const filterFunc = (src: string, _dest: string) => {
        const basename = path.basename(src, ".md");
        const whitelist = ["dendron", "vault"];
        return _.some(whitelist, (ent) => basename.startsWith(ent));
      };
      const dest = resolvePath(vaults[0].fsPath, wsRoot);
      fs.copySync(path.join(dendronWSTemplate.fsPath, "vault"), dest, {
        filter: filterFunc,
      });
    }
    return { vaults, dendronRoot: _ws.dendronRoot };

    // switch (initType) {
    //   case InitializeType.TEMPLATE:
    //     // TDOO:
    //     const remote =
    //       "git@github.com:dendronhq/dendron-workspace-template.git";
    //     await GitV2.clone(`${remote} ${wsRoot}`);
    //     const config = DConfig.getOrCreate(wsRoot);
    //     const vaults = await Promise.all(
    //       config.vaults.map(async (ent) => {
    //         if (!ent.remote) {
    //           throw new DendronError({ msg: "no remote found for vault" });
    //         }
    //         const { url } = ent.remote;
    //         await GitV2.clone(`${url} ${ent.fsPath}`, { cwd: wsRoot });
    //         const vpath = resolvePath(ent.fsPath, wsRoot);
    //         return await new VaultAddCommand().execute({
    //           vpath,
    //           vpathOrig: ent.fsPath,
    //         });
    //       })
    //     );
    //     return _.map(vaults, (ent) => ent.vault);
    //   default:
    //     throw new DendronError({ msg: `init type ${initType} not supported` });
    // }
  };

  async execute(opts: CommandOpts) {
    const ctx = "SetupWorkspaceCommandV2";
    const { wsRoot, skipOpenWs, initType } = _.defaults(opts, {
      skipOpenWs: false,
    });
    Logger.info({ ctx, opts, msg: "enter" });

    if (
      !(await this.handleExistingRoot({
        wsRoot,
        skipConfirmation: opts.skipConfirmation,
      }))
    ) {
      return [];
    }

    const { vaults, dendronRoot } = await this.handleInitializeType({
      initType,
      wsRoot,
    });
    if (!skipOpenWs) {
      vscode.window.showInformationMessage("opening dendron workspace");
      VSCodeUtils.openWS(
        vscode.Uri.file(path.join(dendronRoot, DENDRON_WS_NAME)).fsPath
      );
      return vaults;
    }
    return vaults;
  }
}
