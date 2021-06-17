import _ from "lodash";
import { ViewColumn, window } from "vscode";
import {
  DendronWebViewKey,
  NoteViewMessageType,
  NoteViewMessage,
  assertUnreachable,
} from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-frontend";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { WebViewUtils } from "../views/utils";
import { BasicCommand } from "./base";
import { getWS } from "../workspace";

type CommandOpts = {};
type CommandOutput = any;

const logger = createLogger("showPreviewV1");

export class ShowPreviewV2Command extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.SHOW_PREVIEW_V2.key;

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async execute(_opts: CommandOpts) {
    const title = "Dendron Markdown Preview";

    // Get workspace information
    const ws = getWS();

    // If panel already exists
    const existingPanel = ws.getWebView(DendronWebViewKey.NOTE_PREVIEW);

    if (!_.isUndefined(existingPanel)) {
      try {
        // If error, panel disposed and needs to be recreated
        existingPanel.reveal();
        return;
      } catch {}
    }

    const panel = window.createWebviewPanel(
      "dendronIframe", // Identifies the type of the webview. Used internally
      title, // Title of the panel displayed to the user
      ViewColumn.Beside, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        enableCommandUris: true,
        // enableFindWidget: true,
        localResourceRoots: [],
      }
    );

    const resp = WebViewUtils.genHTMLForWebView({
      title,
      view: DendronWebViewKey.NOTE_PREVIEW,
    });
    panel.webview.html = resp;

    panel.webview.onDidReceiveMessage(async (msg: NoteViewMessage) => {
      const ctx = "onDidReceiveMessage";
      logger.info({ ctx, msg });

      switch (msg.type) {
        case NoteViewMessageType.onClick: {
          logger.info({
            ctx: `${ctx}:onClick`,
            data: msg.data,
          });
          break;
        }
        case NoteViewMessageType.onGetActiveEditor: {
          logger.info({
            ctx: `${ctx}:onGetActiveEditor`,
            data: msg.data,
          });
          const document = VSCodeUtils.getActiveTextEditor()?.document;
          const note = document && VSCodeUtils.getNoteFromDocument(document);
          if (note) {
            // TODO `note` always `undefined`
            panel.webview.postMessage({
              type: "onDidChangeActiveTextEditor",
              data: {
                note,
                foo: "bar",
                sync: true,
              },
              source: "vscode",
            });
          }

          break;
        }
        default:
          assertUnreachable(msg.type);
          break;
      }
    });

    // Update workspace-wide graph panel
    ws.setWebView(DendronWebViewKey.NOTE_PREVIEW, panel);
  }
}
