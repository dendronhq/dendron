import {
  assertUnreachable,
  DendronWebViewKey,
  DMessageEnum,
  DNoteAnchor,
  getStage,
  NoteProps,
  NoteUtils,
  NoteViewMessage,
  NoteViewMessageEnum,
  OnDidChangeActiveTextEditorMsg,
  VaultUtils,
} from "@dendronhq/common-all";
import { findUpTo, WebViewCommonUtils } from "@dendronhq/common-server";
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

/**
 * Extract the last part of the path component
 * @param data
 * @returns
 */
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
  const { path: hrefPath } = vscode.Uri.parse(data.href);
  const out = path.basename(hrefPath, ".html");
  return out;
};

enum LinkType {
  WIKI = "WIKI",
  WEBSITE = "WEBSITE",
  MARKDOWN = "MARKDOWN",
  UNKNOWN = "UNKNOWN",
}

const classifyLink = ({ href }: NoteViewMessage["data"]): LinkType => {
  if (href && href.startsWith("vscode-webview")) {
    return LinkType.WIKI;
  }
  if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
    return LinkType.WEBSITE;
  }
  return LinkType.UNKNOWN;
};

const handleLink = async ({
  linkType,
  data,
}: {
  linkType: LinkType;
  data: NoteViewMessage["data"];
}) => {
  switch (linkType) {
    case LinkType.WIKI: {
      // TODO: should be error
      if (!data.href) return;
      const noteId = extractNoteIdFromHref(data);
      // TODO: should be error
      if (!noteId) return;

      const anchor = extractHeaderAnchorIfExists(data.href);
      const note: NoteProps | undefined = getEngine().notes[noteId];
      return new GotoNoteCommand().execute({
        qs: note.fname,
        vault: note.vault,
        column: vscode.ViewColumn.One,
        anchor,
      });
    }
    case LinkType.WEBSITE: {
      return VSCodeUtils.openLink(data.href!);
    }
    case LinkType.MARKDOWN: {
      // assume local note - open relative to current vault
      const note = getEngine().notes[data.id!];
      if (!note) return;

      // noteId in this case is name of file
      const fullPath = path.join(
        getEngine().wsRoot,
        VaultUtils.getRelPath(note.vault),
        note.id
      );
      return VSCodeUtils.openLink(fullPath);
    }
    default: {
      // default, do nothing. let vscode link handler handle it
      return;
    }
  }
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

    const assetUri = WSUtils.getAssetUri(getExtension().context);
    const pkgRoot = path.dirname(
      findUpTo({ base: __dirname, fname: "package.json", maxLvl: 5 })!
    );
    const pluginViewsRoot: vscode.Uri =
      getStage() === "dev"
        ? vscode.Uri.file(
            path.join(pkgRoot, "..", "dendron-plugin-views", "build")
          )
        : assetUri;
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
        localResourceRoots: [assetUri, pluginViewsRoot],
      }
    );

    const name = "notePreview";
    const jsSrc = vscode.Uri.joinPath(
      pluginViewsRoot,
      "static",
      "js",
      `${name}.bundle.js`
    );
    const cssSrc = vscode.Uri.joinPath(
      pluginViewsRoot,
      "static",
      "css",
      `${name}.styles.css`
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
          const linkType = classifyLink(data);
          await handleLink({ linkType, data });
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
  panel: vscode.WebviewPanel;
}) {
  const root = WSUtils.getAssetUri(getExtension().context);
  const themes = ["light", "dark"];
  const themeMap: any = {};
  themes.map((th) => {
    themeMap[th] = panel.webview
      .asWebviewUri(
        vscode.Uri.joinPath(root, "static", "css", "themes", `${th}.css`)
      )
      .toString();
  });
  const out = WebViewCommonUtils.genVSCodeHTMLIndex({
    jsSrc: panel.webview.asWebviewUri(jsSrc).toString(),
    cssSrc: panel.webview.asWebviewUri(cssSrc).toString(),
    port,
    wsRoot,
    browser: false,
    acquireVsCodeApi: `const vscode = acquireVsCodeApi(); window.vscode = vscode;`,
    themeMap,
  });
  return out;
}
