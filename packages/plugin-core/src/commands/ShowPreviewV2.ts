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
import { Logger } from "../logger";

type CommandOpts = {};
type CommandOutput = any;

const title = "Dendron Preview";

export class ShowPreviewV2Command extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  private activeTextEditor: vscode.TextEditor;

  static key = DENDRON_COMMANDS.SHOW_PREVIEW_V2.key;

  constructor(_name?: string) {
    super(_name);

    // save reference to the activeTextEditor when the command was trigger
    // this makes sure that the `note` retrieval from `activeTextEditor` works in `NoteViewMessageType.onGetActiveEditor` because there it would be `undefined` since focus changed to the preview window
    this.activeTextEditor = VSCodeUtils.getActiveTextEditorOrThrow();
  }

  static onDidChangeHandler(document: vscode.TextDocument) {
    const ctx = "ShowPreviewV2:onDidChangeHandler";

    if (!getWS().workspaceService?.isPathInWorkspace(document.uri.fsPath)) {
      Logger.info({
        ctx,
        uri: document.uri.fsPath,
        msg: "not in workspace",
      });
      return;
    }
    const note = VSCodeUtils.getNoteFromDocument(document);
    if (note) {
      ShowPreviewV2Command.refresh(note);
    }
  }

  static refresh(note: NoteProps) {
    const panel = getWS().getWebView(DendronWebViewKey.NOTE_PREVIEW);
    if (panel) {
      panel.title = `${title} ${note.fname}`;
      panel.webview.postMessage({
        type: "onDidChangeActiveTextEditor",
        data: {
          note,
          sync: true,
        },
        source: "vscode",
      });
    }
  }

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async execute(_opts: CommandOpts) {
    // Get workspace information
    const ws = getWS();

    // If panel already exists
    const existingPanel = ws.getWebView(DendronWebViewKey.NOTE_PREVIEW);

    const viewColumn = vscode.ViewColumn.Beside; // Editor column to show the new webview panel in.
    const preserveFocus = true;

    if (!_.isUndefined(existingPanel)) {
      try {
        // If error, panel disposed and needs to be recreated
        existingPanel.reveal(viewColumn, preserveFocus);
        return;
      } catch {}
    }

    const panel = vscode.window.createWebviewPanel(
      "dendronIframe", // Identifies the type of the webview. Used internally
      title, // Title of the panel displayed to the user
      {
        viewColumn,
        preserveFocus,
      },
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
            // TODO find a better way to differentiate local files from web links
            if (data.href.includes("localhost")) {
              const { path } = vscode.Uri.parse(data.href);
              const noteId = path.match(/.*\/(.*).html/)?.[1];
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
          // only entered on "init" in `plugin-core/src/views/utils.ts:87`
          const note =
            this.activeTextEditor &&
            VSCodeUtils.getNoteFromDocument(this.activeTextEditor.document);
          if (note) {
            ShowPreviewV2Command.refresh(note);
          }

          break;
        }
        default:
          assertUnreachable(msg.type);
          break;
      }
    });

    // TODO add onDidDispose to remote webview from workspace?

    // Update workspace-wide graph panel
    ws.setWebView(DendronWebViewKey.NOTE_PREVIEW, panel);
  }
}
