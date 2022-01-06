import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { OpenDialogOptions, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import { CONSTANTS, WorkspaceType } from "@dendronhq/common-all";
import { WorkspaceUtils } from "@dendronhq/engine-server";

const DENDRON_WS_NAME = CONSTANTS.DENDRON_WS_NAME;

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
  key = DENDRON_COMMANDS.CHANGE_WS.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    // Show a file picker dialog to select existing workspace directory
    const options: OpenDialogOptions = {
      canSelectMany: false,
      openLabel: "Change Workspace",
      canSelectFiles: false,
      canSelectFolders: true,
    };
    const filePath = await VSCodeUtils.openFilePicker(options);

    if (filePath) {
      return { rootDirRaw: filePath };
    }
    return;
  }

  async execute(opts: ChangeWorkspaceCommandOpts) {
    const { rootDirRaw, skipOpenWS } = _.defaults(opts, { skipOpenWS: false });
    if (!fs.existsSync(rootDirRaw)) {
      throw Error(`${rootDirRaw} does not exist`);
    }
    const wsType = await WorkspaceUtils.getWorkspaceTypeFromDir(rootDirRaw);
    if (wsType === WorkspaceType.NONE) {
      window.showErrorMessage(
        `No Dendron workspace found. Please run ${DENDRON_COMMANDS.INIT_WS.title} to create a workspace at ${rootDirRaw}`
      );
      return;
    }
    if (!skipOpenWS) {
      if (wsType === WorkspaceType.CODE)
        VSCodeUtils.openWS(path.join(rootDirRaw, DENDRON_WS_NAME));
      else if (wsType === WorkspaceType.NATIVE) VSCodeUtils.openWS(rootDirRaw);
    }
  }
}
