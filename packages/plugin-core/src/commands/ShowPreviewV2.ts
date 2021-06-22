import _ from "lodash";
import * as vscode from "vscode";
import {
  DendronWebViewKey,
  NoteViewMessageType,
  NoteViewMessage,
  assertUnreachable,
  NoteProps,
} from "@dendronhq/common-all";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { WebViewUtils } from "../views/utils";
import { BasicCommand } from "./base";
import { getEngine, getWS } from "../workspace";
import { GotoNoteCommand } from "./GotoNote";

type CommandOpts = {};
type CommandOutput = any;

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

    const panel = vscode.window.createWebviewPanel(
      "dendronIframe", // Identifies the type of the webview. Used internally
      title, // Title of the panel displayed to the user
      vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    const resp = WebViewUtils.genHTMLForWebView({
      title,
      view: DendronWebViewKey.NOTE_PREVIEW,
    });

    panel.webview.html = resp;

    panel.webview.onDidReceiveMessage(async (msg: NoteViewMessage) => {
      switch (msg.type) {
        case NoteViewMessageType.onClick: {
          const { data } = msg;
          if (data.href) {
            if (data.href.includes("localhost")) {
              const { path } = vscode.Uri.parse(data.href);
              const noteId = path.match(/.*\/(.*).html/)?.[1];
              console.log("is local file (wikilink)", path);
              let note: NoteProps | undefined = undefined;
              if (noteId && (note = getEngine().notes[noteId])) {
                await new GotoNoteCommand().execute({
                  qs: note.fname,
                  vault: note.vault,
                });
              }
            } else {
              VSCodeUtils.openLink(data.href);
            }
          }

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
