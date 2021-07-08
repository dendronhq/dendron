import { ERROR_STATUS, DendronError } from "@dendronhq/common-all";

import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import open from "open";
import path from "path";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { resolvePath, VSCodeUtils } from "../utils";
import { isAnythingSelected } from "../utils/editor";
import { DendronWorkspace, getWS } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = { error?: DendronError; fsPath?: string };

export class OpenLinkCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.OPEN_LINK.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute() {
    const ctx = DENDRON_COMMANDS.OPEN_LINK;
    const ws = getWS();
    this.L.info({ ctx });
    if (!isAnythingSelected()) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: `nothing selected`,
      });
      this.L.error({ error });
      return { error };
    }
    const { text } = VSCodeUtils.getSelection();
    if (_.isUndefined(text)) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: `nothing selected`,
      });
      this.L.error({ error });
      return { error };
    }
    const wsRoot = DendronWorkspace.wsRoot();
    let assetPath: string;
    if (text.startsWith("asset")) {
      const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
      assetPath = path.join(vault2Path({ vault, wsRoot }), text);
    } else {
      assetPath = resolvePath(text, ws.rootWorkspace.uri.fsPath);
    }
    if (!fs.existsSync(assetPath)) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: `${assetPath} does not exist`,
      });
      this.L.error({ error });
      return { error };
    }
    await open(assetPath).catch((err) => {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.UNKNOWN,
        error: err,
      });
      this.L.error({ error });
      return { error };
    });
    return { filePath: assetPath };
  }
}
