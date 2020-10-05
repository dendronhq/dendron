import { NoteUtilsV2, SchemaUtilsV2 } from "@dendronhq/common-all";
import {
  note2File,
  resolveTilde,
  schemaModuleOpts2File,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import vscode from "vscode";
import { DENDRON_WS_NAME, GLOBAL_STATE } from "../constants";
import { WorkspaceConfig } from "../settings";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {
  rootDirRaw: string;
  skipOpenWs?: boolean;
  emptyWs?: boolean;
  /**
   * override prompts
   */
  skipConfirmation?: boolean;
};

type CommandInput = {
  rootDirRaw: string;
  emptyWs: boolean;
};

type CommandOutput = any;

export { CommandOpts as SetupWorkspaceOpts };

export class SetupWorkspaceCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  async gatherInputs(): Promise<CommandInput | undefined> {
    const rootDirRaw = await VSCodeUtils.gatherFolderPath({
      default: path.join(resolveTilde("~"), "Dendron"),
    });
    if (_.isUndefined(rootDirRaw)) {
      return;
    }
    const isFirstWS = _.isUndefined(
      DendronWorkspace.instance().context.globalState.get<string | undefined>(
        GLOBAL_STATE.DENDRON_FIRST_WS
      )
    );
    const options = [
      "initialize with dendron tutorial notes",
      "initialize empty repository",
    ];

    // don't prompt for option if first ws
    if (isFirstWS) {
      return { rootDirRaw, emptyWs: false };
    }

    const initializeEmpty = await VSCodeUtils.showQuickPick(options, {
      placeHolder: "initialize with dendron tutorial notes",
      ignoreFocusOut: true,
    });
    if (!initializeEmpty) {
      return;
    }
    const emptyWs = initializeEmpty === options[1];
    return { rootDirRaw, emptyWs };
  }

  async execute(opts: CommandOpts) {
    const ctx = "SetupWorkspaceCommand extends BaseCommand";
    const ws = DendronWorkspace.instance();
    const { rootDirRaw: rootDir, skipOpenWs, emptyWs } = _.defaults(opts, {
      skipOpenWs: false,
      emptyWs: false,
    });
    ws.L.info({ ctx, rootDir, skipOpenWs });

    // handle existing
    if (fs.existsSync(rootDir) && !opts.skipConfirmation) {
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
        return;
      } else if (resp === "delete") {
        try {
          fs.removeSync(rootDir);
        } catch (err) {
          ws.L.error(JSON.stringify(err));
          vscode.window.showErrorMessage(
            `error removing ${rootDir}. please check that it's not currently open`
          );
          return;
        }
        vscode.window.showInformationMessage(`removed ${rootDir}`);
      }
    }

    // make sure root dir exists
    fs.ensureDirSync(rootDir);
    const dendronWSTemplate = vscode.Uri.joinPath(
      ws.extensionAssetsDir,
      "dendronWS"
    );
    // copy over jekyll config
    const dendronJekyll = vscode.Uri.joinPath(ws.extensionAssetsDir, "jekyll");
    fs.copySync(path.join(dendronJekyll.fsPath), path.join(rootDir, "docs"));
    // create vault
    const vaultPath = path.join(rootDir, "vault");
    fs.ensureDirSync(vaultPath);

    // copy over notes
    if (!emptyWs) {
      const filterFunc = (src: string, _dest: string) => {
        const basename = path.basename(src, ".md");
        // const blacklist = ["project", "meet", "lsp", "p"];
        // will filter the directory first
        const whitelist = ["dendron", "vault"];
        return _.some(whitelist, (ent) => basename.startsWith(ent));
      };
      fs.copySync(path.join(dendronWSTemplate.fsPath, "vault"), vaultPath, {
        filter: filterFunc,
      });
    } else {
      // make sure roto files exist
      const note = NoteUtilsV2.createRoot({});
      const schema = SchemaUtilsV2.createRootModule({});
      await note2File(note, vaultPath);
      await schemaModuleOpts2File(schema, vaultPath, "root");
    }

    // write workspace defaults
    WorkspaceConfig.write(rootDir);
    if (!opts.skipOpenWs) {
      vscode.window.showInformationMessage("opening dendron workspace");
      return VSCodeUtils.openWS(
        vscode.Uri.file(path.join(rootDir, DENDRON_WS_NAME)).fsPath
      );
    }
    return;
  }
}
