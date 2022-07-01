import {
  DendronError,
  ERROR_STATUS,
  ExtensionEvents,
} from "@dendronhq/common-all";
import { resolvePath, vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import open from "open";
import path from "path";
import { env, Uri, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { AnalyticsUtils } from "../utils/analytics";
import { getURLAt } from "../utils/md";
import { VSCodeUtils } from "../vsCodeUtils";
import { getDWorkspace, getExtension } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = { error?: DendronError; fsPath?: string };

export class OpenLinkCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.OPEN_LINK.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute(opts?: { uri?: string }) {
    console.log("OpenLink is being executed");
    showDepreciationWarnign();

    const ctx = DENDRON_COMMANDS.OPEN_LINK;
    this.L.info({ ctx });

    let text = "";

    text = opts?.uri ?? getURLAt(VSCodeUtils.getActiveTextEditor());

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
          innerError: err,
        });
        this.L.error({ error });
        return { error };
      });
    }
    return { filepath: assetPath };
  }
}

const showDepreciationWarnign = () => {
  AnalyticsUtils.track(ExtensionEvents.DeprecationNoticeShow, {
    source: DENDRON_COMMANDS.OPEN_LINK.key,
  });
  window
    .showWarningMessage(
      "Heads up that OpenLink is being deprecated and will be replaced with the 'Goto' command",
      "See whats changed"
    )
    .then((resp) => {
      console.log(resp);
      if (resp === "See whats changed") {
        AnalyticsUtils.track(ExtensionEvents.DeprecationNoticeAccept, {
          source: DENDRON_COMMANDS.OPEN_LINK.key,
        });
        VSCodeUtils.openLink(
          //TODO: This link needs to be updated
          "https://wiki.dendron.so/notes/ftohqknticu6bw4cfmzskq6"
        );
      }
    });
};
