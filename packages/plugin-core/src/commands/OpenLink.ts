import { DendronError, ERROR_STATUS } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import open from "open";
import path from "path";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { resolvePath, VSCodeUtils } from "../utils";
import { isAnythingSelected } from "../utils/editor";
import { getExtension, getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { Selection, env, Uri, window } from "vscode";

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

    if (!isAnythingSelected()) {
      window.showInformationMessage(
        "nothing selected, searching for valid link"
      );
    }

    const editor = VSCodeUtils.getActiveTextEditor();

    if (editor) {
      const docText = editor.document.getText();
      const offsetStart = editor.document.offsetAt(editor.selection.start);
      const offsetEnd = editor.document.offsetAt(editor.selection.end);

      const selectUri = true;
      const validUriChars = "A-Za-z0-9-._~:/?#@!$&'*+,;%=";
      const invalidUriChars = ["[^", validUriChars, "]"].join("");
      const regex = new RegExp(invalidUriChars);

      const selectedText = docText.substring(offsetStart, offsetEnd);

      if (selectedText !== "" && regex.test(selectedText)) {
        const error = DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: `invalid character found in selection`,
        });
        this.L.error({ error });
        return { error };
      }

      const leftSplit = docText.substring(0, offsetStart).split(regex);
      const leftText = leftSplit[leftSplit.length - 1];
      const selectStart = offsetStart - leftText.length;

      const rightSplit = docText.substring(offsetEnd, docText.length - 1);
      const rightText = rightSplit.substring(0, regex.exec(rightSplit)?.index);
      const selectEnd = offsetEnd + rightText.length;

      if (selectEnd && selectStart) {
        if (
          selectStart >= 0 &&
          selectStart < selectEnd &&
          selectEnd <= docText.length - 1
        ) {
          if (selectUri) {
            editor.selection = new Selection(
              editor.document.positionAt(selectStart),
              editor.document.positionAt(selectEnd)
            );
            editor.revealRange(editor.selection);
          }
          text = [leftText, rightText].join("");
        }
      }
    }

    if (_.isUndefined(text) || text === "") {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: `no valid path or URL selected`,
      });
      this.L.error({ error });
      return { error };
    }

    let assetPath: string;
    if (text.indexOf("://") !== -1) {
      window.showInformationMessage(
        "the selection reads as a full URI so an attempt will be made to open it"
      );
      env.openExternal(Uri.parse(text));
      assetPath = resolvePath(text, getExtension().rootWorkspace.uri.fsPath);
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
    return { filePath: assetPath };
  }
}
