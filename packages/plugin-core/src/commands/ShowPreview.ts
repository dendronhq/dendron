import {
  assertUnreachable,
  DendronWebViewKey,
  DMessageEnum,
  DNoteAnchor,
  NoteProps,
  NoteUtils,
  NoteViewMessage,
  NoteViewMessageEnum,
  OnDidChangeActiveTextEditorMsg,
  VaultUtils
} from "@dendronhq/common-all";
import { WebViewCommonUtils } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils, WSUtils } from "../utils";
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
  /**
   * Will return a link like 'vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/foobar'
   * The path component includes a `/` (eg. `/foobar`) so we remove it
   */
  const { path } = vscode.Uri.parse(data.href);
  return path.slice(1);
};

export class ShowPreviewCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SHOW_PREVIEW.key;

  static onDidChangeHandler(document: vscode.TextDocument) {
    const maybeNote = tryGetNoteFromDocument(document);
    if (!_.isUndefined(maybeNote)) ShowPreviewCommand.refresh(maybeNote);
  }

  static refresh(note: NoteProps) {
    const ctx = { ctx: "ShowPreview:refresh", fname: note.fname };
    const panel = getExtension().getWebView(DendronWebViewKey.NOTE_PREVIEW);
    Logger.debug({ ...ctx, state: "enter" });
    if (panel) {
      Logger.debug({ ...ctx, state: "panel found" });
      panel.title = `${title} ${note.fname}`;
      panel.webview.postMessage({
        type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
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
    const ctx = "ShowPreview";
    const ext = getExtension();
    const existingPanel = ext.getWebView(DendronWebViewKey.NOTE_PREVIEW);
    const viewColumn = vscode.ViewColumn.Beside; // Editor column to show the new webview panel in.
    const preserveFocus = true;

    // show existing panel if exist
    if (!_.isUndefined(existingPanel)) {
      Logger.info({ ctx, msg: "reveal existing" });
      try {
        // If error, panel disposed and needs to be recreated
        existingPanel.reveal(viewColumn, preserveFocus);
        return;
      } catch (error: any) {
        Logger.error({ ctx, error });
      }
    }
    Logger.info({ ctx, msg: "creating new" });

    // TODO: change based on dev/prod
    const root =
      "/Users/kevinlin/code/dendron/packages/dendron-plugin-views/build";
    const assetUri = WSUtils.getAssetUri(getExtension().context);
    const panel = vscode.window.createWebviewPanel(
      "dendronPreview",
      "Dendron Preview",
      {
        viewColumn,
        preserveFocus,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: true,
        localResourceRoots: [assetUri, vscode.Uri.file(root)],
      }
    );

    const name = "notePreview";
    const jsSrc = vscode.Uri.file(
      path.join(root, "static", "js", `${name}.bundle.js`)
    );
    const cssSrc = vscode.Uri.file(
      path.join(root, "static", "css", `${name}.styles.css`)
    );
    const port = getExtension().port!;
    panel.webview.onDidReceiveMessage(async (msg: NoteViewMessage) => {
      const ctx = "ShowPreview:onDidReceiveMessage";
      Logger.debug({ ctx, msgType: msg.type });
      switch (msg.type) {
        case DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR:
        case DMessageEnum.INIT: {
          // do nothing
          break;
        }
        case DMessageEnum.MESSAGE_DISPATCHER_READY: {
          // if ready, get current note
          const note = VSCodeUtils.getActiveNote();
          if (note) {
            Logger.debug({
              ctx,
              msg: "got active note",
              note: NoteUtils.toLogObj(note),
            });
            ShowPreviewCommand.refresh(note);
          }
          break;
        }
        case NoteViewMessageEnum.onClick: {
          const { data } = msg;
          if (data.href) {
            // TODO: assuem local link

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
            } else if (noteId && !note && data.id) {
              // assume local note - open relative to current vault
              const note = this.getNote(data.id);
              if (!note) return;

              // noteId in this case is name of file
              const fullPath = path.join(
                getEngine().wsRoot,
                VaultUtils.getRelPath(note.vault),
                noteId
              );
              VSCodeUtils.openLink(fullPath);
            }
          }

          break;
        }
        case NoteViewMessageEnum.onGetActiveEditor: {
          // only entered on "init" in `plugin-core/src/views/utils.ts:87`
          Logger.debug({ ctx, "msg.type": "onGetActiveEditor" });
          const activeTextEditor = VSCodeUtils.getActiveTextEditor();
          const maybeNote = !_.isUndefined(activeTextEditor)
            ? tryGetNoteFromDocument(activeTextEditor?.document)
            : undefined;
          if (!_.isUndefined(maybeNote)) ShowPreviewCommand.refresh(maybeNote);
          break;
        }
        case DMessageEnum.INIT: {
          // noop
          break;
        }
        default:
          assertUnreachable(msg.type);
      }
    });

    const html = getWebviewContent({
      jsSrc,
      cssSrc,
      port,
      wsRoot: ext.getEngine().wsRoot,
      panel,
    });

    panel.webview.html = html;

    // Update workspace-wide panel
    ext.setWebView(DendronWebViewKey.NOTE_PREVIEW, panel);

    // remove webview from workspace when user closes it
    // this prevents throwing `Uncaught Error: Webview is disposed` in `ShowPreviewCommand#refresh`
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
  panel,
}: {
  jsSrc: vscode.Uri;
  cssSrc: vscode.Uri;
  port: number;
  wsRoot: string;
  panel: vscode.WebviewPanel,
}) {
  const root = WSUtils.getAssetUri(getExtension().context);
  const themes = ["light", "dark"];
  const themeMap: any = {
  }
  themes.map(th => {
    themeMap[th] = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(root, "css", "themes", `${th}.css`)
  ).toString()})
  const out = WebViewCommonUtils.genVSCodeHTMLIndex({
    jsSrc: panel.webview.asWebviewUri(jsSrc),
    cssSrc: panel.webview.asWebviewUri(cssSrc),
    port,
    wsRoot,
    browser: false,
    acquireVsCodeApi: `const vscode = acquireVsCodeApi(); window.vscode = vscode;`,
    themeMap,
  });
  return out;
}
