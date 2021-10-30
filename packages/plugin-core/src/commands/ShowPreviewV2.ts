import {
  assertUnreachable,
  DendronWebViewKey,
  DMessageType,
  DNoteAnchor,
  NoteProps,
  NoteViewMessage,
  NoteViewMessageType,
  OnDidChangeActiveTextEditorMsg
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
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

export const extractHeaderAnchorIfExists = (
  link: string
): DNoteAnchor | undefined => {
  if (link.indexOf("#") === -1) {
    return undefined;
  } else {
    const tokens = link.split("#");
    const anchorValue = tokens[tokens.length - 1];
    return {
      type: "header",
      value: anchorValue,
    };
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
  const linkToNoteId = extractNoteIdFromHref(opts.data);

  return linkToNoteId === opts.data.id;
};

export const extractNoteIdFromHref = (data: {
  id?: string;
  href?: string;
}): string | undefined => {
  if (data.href === undefined) {
    return undefined;
  }
  // For some cases such as markdown value='[head2](#head2)' the href isn't as nice
  // and looks like href='http://localhost:3005/vscode/note-preview.html?ws=WS-VALUE&port=3005#head2'
  // which currently happens when linking within the same note so we will consider it a special
  // case of parsing for now and return the id of the current note.
  if (data.href.includes("vscode/note-preview")) {
    return data.id;
  }

  // In normal cases such as markdown value='[[#head2]]' with
  // href='http://localhost:3005/vscode/0TDNEYgYvCs3ooZEuknNZ.html#head2' we will
  // parse the href and extract the note id.
  // The id within href can be without html suffix such as:
  // * http://localhost:3005/vscode/0TDNEYgYvCs3ooZEuknNZ#head2
  // * http://localhost:3005/vscode/0TDNEYgYvCs3ooZEuknNZ
  //
  // Regex is in reference to uuid.ts/genUUID() to match the note id.
  // Regex: https://regex101.com/r/7pDj6G/1
  const { path } = vscode.Uri.parse(data.href);
  const noteId = path.match(/vscode\/([a-zA-Z0-9-_]*)/)?.[1];

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
    const root =
      "/Users/kevinlin/code/dendron/packages/dendron-plugin-views/build";
    const panel = vscode.window.createWebviewPanel(
      "dendronPreview",
      "Dendron Preview",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(root)],
      }
    );

    const name = "notePreview";
    const jsSrc = vscode.Uri.file(
      path.join(root, "static", "js", `${name}.bundle.js`)
    );
    const cssSrc = vscode.Uri.file(
      path.join(root, "static", "css", `${name}.styles.css`)
    );
    const ext = getExtension();
    const port = getExtension().port!;
    panel.webview.html = getWebviewContent({
      jsSrc: panel.webview.asWebviewUri(jsSrc),
      cssSrc: panel.webview.asWebviewUri(cssSrc),
      port,
      wsRoot: ext.getEngine().wsRoot,
    });

    panel.webview.onDidReceiveMessage(async (msg: NoteViewMessage) => {
      const ctx = "ShowPreview:onDidReceiveMessage";
      switch (msg.type) {
        case NoteViewMessageType.onClick: {
          const { data } = msg;
          if (data.href) {
            // TODO find a better way to differentiate local files from web links (`data-` attribute)
            if (data.href.includes("localhost")) {
              const noteId = extractNoteIdFromHref(data);
              const anchor = extractHeaderAnchorIfExists(data.href);

              const note: NoteProps | undefined = this.getNote(noteId);
              if (isLinkingWithinSameNote({ data }) && note && anchor) {
                await new GotoNoteCommand().execute({
                  qs: note.fname,
                  vault: note.vault,
                  column: vscode.ViewColumn.One,
                  anchor,
                });
              } else if (noteId && note) {
                await new GotoNoteCommand().execute({
                  qs: note.fname,
                  vault: note.vault,
                  column: vscode.ViewColumn.One,
                  anchor,
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
        case NoteViewMessageType.messageDispatcherReady:
          break;
        default:
          assertUnreachable(msg.type);
      }
    });
  }

  async executeOld(_opts?: CommandOpts) {
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
              const noteId = extractNoteIdFromHref(data);
              const anchor = extractHeaderAnchorIfExists(data.href);

              const note: NoteProps | undefined = this.getNote(noteId);
              if (isLinkingWithinSameNote({ data }) && note && anchor) {
                await new GotoNoteCommand().execute({
                  qs: note.fname,
                  vault: note.vault,
                  column: vscode.ViewColumn.One,
                  anchor,
                });
              } else if (noteId && note) {
                await new GotoNoteCommand().execute({
                  qs: note.fname,
                  vault: note.vault,
                  column: vscode.ViewColumn.One,
                  anchor,
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
        case NoteViewMessageType.messageDispatcherReady:
          break;
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

function getWebviewContent({
  jsSrc,
  cssSrc,
  port,
  wsRoot,
}: {
  jsSrc: vscode.Uri;
  cssSrc: vscode.Uri;
  port: number;
  wsRoot: string;
}) {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
        <link href="${cssSrc}" rel="stylesheet" />
    </head>
    <body>
      <div id="root" data-port=${port} data-ws=${wsRoot}></div>
      <script src="${jsSrc}""></script>
    </body>
    </html>`;
}
