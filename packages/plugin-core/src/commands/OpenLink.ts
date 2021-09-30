import { DendronError, ERROR_STATUS } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import open from "open";
import path from "path";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { resolvePath, VSCodeUtils } from "../utils";
import { getURLAt } from "../utils/md";
import { getExtension, getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { env, Uri, window } from "vscode";

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
    this.L.info({ ctx });

    let text = "";

    text = getURLAt(VSCodeUtils.getActiveTextEditor());

    if (_.isUndefined(text) || text === "") {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: `no valid path or URL selected`,
      });
      this.L.error({ error });
      return { error };
    }
    let assetPath: string;
    if (
      text.indexOf(":/") !== -1 ||
      text.indexOf("/") === 0 ||
      text.indexOf(":\\") !== -1
    ) {
      window.showInformationMessage(
        "the selection reads as a full URI or filepath so an attempt will be made to open it"
      );
      env.openExternal(Uri.parse(text.replace("\\", "/"))); // make sure vscode doesn't choke on "\"s
      assetPath = text;
    } else {
      const wsRoot = getDWorkspace().wsRoot;

      if (text.startsWith("asset")) {
        const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
        assetPath = path.join(vault2Path({ vault, wsRoot }), text);
      } else {
        assetPath = resolvePath(text, getExtension().rootWorkspace.uri.fsPath);
      }
      if (!fs.existsSync(assetPath)) {
        const error = DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: `no valid path or URL selected`,
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
    }
    return { filepath: assetPath };
  }
}
