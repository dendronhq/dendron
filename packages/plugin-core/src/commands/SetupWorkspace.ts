import { resolveTilde } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import vscode from "vscode";
import { DENDRON_WS_NAME } from "../constants";
import { WorkspaceConfig } from "../settings";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {
  rootDirRaw: string;
  skipOpenWs?: boolean;
  emptyWs?: boolean;
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
    const options = [
      "initialize with dendron tutorial notes",
      "initialize empty repository",
    ];
    const initializeEmpty = await VSCodeUtils.showQuickPick(options, {
      placeHolder: "initialize with dendron tutorial notes",
      ignoreFocusOut: true,
    });
    const emptyWs = initializeEmpty === options[1];
    if (!emptyWs) {
      return;
    }
    return { rootDirRaw, emptyWs };
  }

  async execute(opts: CommandOpts) {
    const ctx = "SetupWorkspaceCommand extends BaseCommand";
    const ws = DendronWorkspace.instance();
    const { rootDirRaw: rootDir, skipOpenWs } = _.defaults(opts, {
      skipOpenWs: false,
    });
    ws.L.info({ ctx, rootDir, skipOpenWs });

    // handle existing
    if (fs.existsSync(rootDir)) {
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
    //const notesSrc = vscode.Uri.joinPath(ws.extensionAssetsDir, "notes");
    if (opts.emptyWs) {
      fs.copySync(
        path.join(dendronWSTemplate.fsPath, "dendron.yml"),
        path.join(rootDir, "dendron.yml")
      );
      fs.copySync(
        path.join(dendronWSTemplate.fsPath, "docs"),
        path.join(rootDir, "docs")
      );
      fs.ensureDirSync(path.join(rootDir, "vault"));
    } else {
      fs.copySync(dendronWSTemplate.fsPath, rootDir);
    }
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
