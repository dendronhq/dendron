import {
  assertUnreachable,
  DendronWebViewKey,
  DMessageType,
  NoteProps,
  NoteViewMessage,
  NoteViewMessageType,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { WebViewUtils } from "../views/utils";
import { getEngine, getExtension } from "../workspace";
import { BasicCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";

type CommandOpts = {};
type CommandOutput = any;

const title = "Dendron Preview";

export const extractAnchorIfExists = (link: string) => {
  if (link.indexOf("#") === -1) {
    return undefined;
  } else {
    const tokens = link.split("#");
    return tokens[tokens.length - 1];
  }
};

const tryGetNoteFromDocument = (
  document: vscode.TextDocument
): NoteProps | undefined => {
  if (
    !getExtension().workspaceService?.isPathInWorkspace(document.uri.fsPath)
  ) {
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
};

/** Returns true when we are attempting to reference a place within the same note.
 *  Such as a different header section.*/
const isLinkingWithinSameNote = (opts: {
  data: { id?: string; href?: string };
}) => {
  const linkToNoteId = extractNoteId(opts.data);
  return linkToNoteId === opts.data.id;
};

const extractNoteId = (data: {
  id?: string;
  href?: string;
}): string | undefined => {
  if (data.href === undefined) {
    return undefined;
  }

  // In normal cases such as markdown value='[[#head2]]' with
  // href='http://localhost:3005/vscode/0TDNEYgYvCs3ooZEuknNZ.html#head2' we will
  // parse the href and extract the note id.
  const { path } = vscode.Uri.parse(data.href);
  const noteId = path.match(/.*\/(.*).html/)?.[1];

  // However, for some cases such as markdown value='[head2](#head2)' the href isn't as nice
  // and looks like href='http://localhost:3005/vscode/note-preview.html?ws=WS-VALUE&port=3005#head2'
  // which currently happens when linking within the same note so we will consider it a special
  // case of parsing for now and return the id of the current note.
  if (noteId === "note-preview") {
    return data.id;
  }
  return noteId;
};

export class ShowPreviewV2Command extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SHOW_PREVIEW_V2.key;

  static onDidChangeHandler(document: vscode.TextDocument) {
    const maybeNote = tryGetNoteFromDocument(document);
    if (!_.isUndefined(maybeNote)) ShowPreviewV2Command.refresh(maybeNote);
  }

  static refresh(note: NoteProps) {
    const ctx = { ctx: "ShowPreview:refresh", fname: note.fname };
    const panel = getExtension().getWebView(DendronWebViewKey.NOTE_PREVIEW);
    Logger.debug({ ...ctx, state: "enter" });
    if (panel) {
      Logger.debug({ ...ctx, state: "panel found" });
      panel.title = `${title} ${note.fname}`;
      panel.webview.postMessage({
        type: DMessageType.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
        data: {
          note,
          syncChangedNote: true,
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
    const ext = getExtension();

    // If panel already exists
    const existingPanel = ext.getWebView(DendronWebViewKey.NOTE_PREVIEW);

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

    const resp = await WebViewUtils.genHTMLForWebView({
      title,
      view: DendronWebViewKey.NOTE_PREVIEW,
    });

    panel.webview.html = resp;

    panel.webview.onDidReceiveMessage(async (msg: NoteViewMessage) => {
      const ctx = "ShowPreview:onDidReceiveMessage";
      switch (msg.type) {
        case NoteViewMessageType.onClick: {
          const { data } = msg;
          if (data.href) {
            // TODO find a better way to differentiate local files from web links (`data-` attribute)
            if (data.href.includes("localhost")) {
              const noteId = extractNoteId(data);

              const note: NoteProps | undefined = this.getNote(noteId);
              if (isLinkingWithinSameNote({ data }) && note) {
                const anchor = extractAnchorIfExists(data.href);
                if (anchor) {
                  await new GotoNoteCommand().execute({
                    qs: note.fname,
                    vault: note.vault,
                    column: vscode.ViewColumn.One,
                    anchor: {
                      type: "header",
                      value: anchor,
                    },
                  });
                }
              } else if (noteId && note) {
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
          Logger.debug({ ctx, "msg.type": "onGetActiveEditor" });
          const activeTextEditor = VSCodeUtils.getActiveTextEditor();
          const maybeNote = !_.isUndefined(activeTextEditor)
            ? tryGetNoteFromDocument(activeTextEditor?.document)
            : undefined;
          if (!_.isUndefined(maybeNote))
            ShowPreviewV2Command.refresh(maybeNote);
          break;
        }
        default:
          assertUnreachable(msg.type);
      }
    });

    // Update workspace-wide graph panel
    ext.setWebView(DendronWebViewKey.NOTE_PREVIEW, panel);

    // remove webview from workspace when user closes it
    // this prevents throwing `Uncaught Error: Webview is disposed` in `ShowPreviewV2Command#refresh`
    panel.onDidDispose(() => {
      const ctx = "ShowPreview:onDidDispose";
      Logger.debug({ ctx, state: "dispose preview" });
      ext.setWebView(DendronWebViewKey.NOTE_PREVIEW, undefined);
    });
  }

  private getNote(noteId: string | undefined) {
    if (noteId === undefined) {
      return undefined;
    }
    return getEngine().notes[noteId];
  }
}
