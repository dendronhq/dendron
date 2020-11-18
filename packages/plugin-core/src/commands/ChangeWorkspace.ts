import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { window } from "vscode";
import { DENDRON_COMMANDS, DENDRON_WS_NAME } from "../constants";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";

type ChangeWorkspaceCommandOpts = {
  rootDirRaw: string;
  skipOpenWS?: boolean;
};

type CommandInput = {
  rootDirRaw: string;
};

export class ChangeWorkspaceCommand extends BasicCommand<
  ChangeWorkspaceCommandOpts,
  any
> {
  static key = DENDRON_COMMANDS.CHANGE_WS.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    const rootDirRaw = await VSCodeUtils.gatherFolderPath();
    if (_.isUndefined(rootDirRaw)) {
      return;
    }
    return { rootDirRaw };
  }

  async execute(opts: ChangeWorkspaceCommandOpts) {
    const { rootDirRaw, skipOpenWS } = _.defaults(opts, { skipOpenWS: false });
    if (!fs.existsSync(rootDirRaw)) {
      throw Error(`${rootDirRaw} does not exist`);
    }
    if (!fs.existsSync(path.join(rootDirRaw, DENDRON_WS_NAME))) {
      window.showErrorMessage(
        `no workspace file found. please run ${DENDRON_COMMANDS.INIT_WS.title} to create a workspace at ${rootDirRaw}`
      );
      return;
    }
    if (!skipOpenWS) {
      VSCodeUtils.openWS(path.join(rootDirRaw, DENDRON_WS_NAME));
    }
  }
}
