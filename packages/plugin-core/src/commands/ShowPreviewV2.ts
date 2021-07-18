import {
  assertUnreachable, DendronWebViewKey, DMessageType, NoteProps, NoteViewMessage, NoteViewMessageType, OnDidChangeActiveTextEditorMsg
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { WebViewUtils } from "../views/utils";
import { getEngine, getWS } from "../workspace";
import { BasicCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";

type CommandOpts = {};
type CommandOutput = any;

const title = "Dendron Preview";


const tryGetNoteFromDocument = (document: vscode.TextDocument): NoteProps|undefined => {
  if (!getWS().workspaceService?.isPathInWorkspace(document.uri.fsPath)) {
    Logger.info({
      uri: document.uri.fsPath,
      msg: "not in workspace",
    });
    return;
  }
  try {
    const note = VSCodeUtils.getNoteFromDocument(document);
    return note;
  } catch (err) {
    Logger.info({
      uri: document.uri.fsPath,
      msg: "not a valid note",
    });
  }
  return;
}

export class ShowPreviewV2Command extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SHOW_PREVIEW_V2.key;

  static onDidChangeHandler(document: vscode.TextDocument) {
    const maybeNote = tryGetNoteFromDocument(document)
    if(!_.isUndefined(maybeNote)) ShowPreviewV2Command.refresh(maybeNote);
  }

  static refresh(note: NoteProps) {
    const panel = getWS().getWebView(DendronWebViewKey.NOTE_PREVIEW);
    if (panel) {
      panel.title = `${title} ${note.fname}`;
      panel.webview.postMessage({
        type: DMessageType.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
        data: {
          note,
          syncChangedNote: true
        },
        source: "vscode",
      } as OnDidChangeActiveTextEditorMsg);
    }
  }

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async execute(_opts?: CommandOpts) {
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
      } catch (error) {
        console.error(error);
      }
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
        enableFindWidget: true,
        enableCommandUris: true,
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
            // TODO find a better way to differentiate local files from web links (`data-` attribute)
            if (data.href.includes("localhost")) {
              const { path } = vscode.Uri.parse(data.href);
              const noteId = path.match(/.*\/(.*).html/)?.[1];
              let note: NoteProps | undefined;
              // eslint-disable-next-line no-cond-assign
              if (noteId && (note = getEngine().notes[noteId])) {
                await new GotoNoteCommand().execute({
                  qs: note.fname,
                  vault: note.vault,
                  column: vscode.ViewColumn.One,
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
          const activeTextEditor = VSCodeUtils.getActiveTextEditor();
          const maybeNote = !_.isUndefined(activeTextEditor) ? tryGetNoteFromDocument(activeTextEditor?.document) : undefined;
          if(!_.isUndefined(maybeNote)) ShowPreviewV2Command.refresh(maybeNote);
          break;
        }
        default:
          assertUnreachable(msg.type);
          break;
      }
    });

    // Update workspace-wide graph panel
    ws.setWebView(DendronWebViewKey.NOTE_PREVIEW, panel);

    // remove webview from workspace when user closes it
    // this prevents throwing `Uncaught Error: Webview is disposed` in `ShowPreviewV2Command#refresh`
    panel.onDidDispose(() => {
      ws.setWebView(DendronWebViewKey.NOTE_PREVIEW, undefined);
    });
  }
}
