import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DENDRON_WS_NAME } from "../constants";
import { WorkspaceConfig } from "../settings";
import { resolvePath, VSCodeUtils } from "../utils";
import { BaseCommand } from "./base";
import { window } from "vscode";

type ChangeWorkspaceCommandOpts = {
  rootDirRaw: string;
  skipOpenWS?: boolean;
};

type CommandInput = {
    rootDirRaw: string
}

export class ChangeWorkspaceCommand extends BaseCommand<
  ChangeWorkspaceCommandOpts,
  any
> {
  async gatherInput(): Promise<CommandInput> {
    const ctx = "ChangeWorkspaceCommand";
    const resp = await window.showInputBox({
      prompt: "Select your folder for dendron",
      ignoreFocusOut: true,
      validateInput: (input: string) => {
        if (!path.isAbsolute(input)) {
          if (input[0] !== "~") {
            return "must enter absolute path";
          }
        }
        return undefined;
      },
    });
    if (!resp) {
      this.L.error({ ctx, msg: "no input" });
      // TODO
      throw Error("must enter");
    }
    return {rootDirRaw: resp};
  }
  async execute(opts: ChangeWorkspaceCommandOpts) {
    const { rootDirRaw, skipOpenWS } = _.defaults(opts, { skipOpenWS: false });
    const rootDir = resolvePath(rootDirRaw);
    if (!fs.existsSync(rootDir)) {
      throw Error(`${rootDir} does not exist`);
    }
    if (!fs.existsSync(path.join(rootDir, DENDRON_WS_NAME))) {
      WorkspaceConfig.write(rootDir, { rootVault: "." });
    }
    if (!skipOpenWS) {
      VSCodeUtils.openWS(path.join(rootDir, DENDRON_WS_NAME));
    }
  }
}
