import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DENDRON_WS_NAME } from "../constants";
import { WorkspaceConfig } from "../settings";
import { VSCodeUtils } from "../utils";
import { BaseCommand } from "./base";

type ChangeWorkspaceCommandOpts = {
  rootDirRaw: string
  skipOpenWS?: boolean;
};

type CommandInput = {
    rootDirRaw: string
}

export class ChangeWorkspaceCommand extends BaseCommand<
  ChangeWorkspaceCommandOpts,
  any,
  CommandInput
> {

  async gatherInputs(): Promise<CommandInput|undefined> {
    const rootDirRaw = await VSCodeUtils.gatherFolderPath();
    if (_.isUndefined(rootDirRaw)) {
        return;
    } 
    return {rootDirRaw};
  }

  async execute(opts: ChangeWorkspaceCommandOpts) {
    const { rootDirRaw, skipOpenWS } = _.defaults(opts, { skipOpenWS: false });
    if (!fs.existsSync(rootDirRaw)) {
      throw Error(`${rootDirRaw} does not exist`);
    }
    if (!fs.existsSync(path.join(rootDirRaw, DENDRON_WS_NAME))) {
      WorkspaceConfig.write(rootDirRaw, { rootVault: "." });
    }
    if (!skipOpenWS) {
      VSCodeUtils.openWS(path.join(rootDirRaw, DENDRON_WS_NAME));
    }
  }
}
