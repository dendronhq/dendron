import {
  assertUnreachable,
  DendronError,
  DendronWebViewKey,
  DMessageEnum,
  DNoteAnchor,
  ERROR_STATUS,
  ErrorFactory,
  getStage,
  NoteProps,
  NotePropsDict,
  NoteUtils,
  NoteViewMessage,
  NoteViewMessageEnum,
  OnDidChangeActiveTextEditorMsg,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  findUpTo,
  vault2Path,
  WebViewCommonUtils,
} from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import open from "open";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils, WSUtils } from "../utils";
import { getEngine, getExtension } from "../workspace";
import { BasicCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";
import { QuickPickUtil } from "../utils/quickPick";

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
    throw ErrorFactory.createInvalidStateError({ message: `href is missing.` });
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

export enum LinkType {
  WIKI = "WIKI",
  ASSET = "ASSET",
  WEBSITE = "WEBSITE",
  MARKDOWN = "MARKDOWN",
  UNKNOWN = "UNKNOWN",
}

const classifyLink = ({ href }: NoteViewMessage["data"]): LinkType => {
  if (href && href.startsWith("vscode-webview") && href.includes("/assets/")) {
    // Note: currently even when the wiki link is fully vault qualified as example
    // of [[dendron://assets/note-in-asset-vault]] When it is clicked within the preview
    // the href will look along the lines of:
    // `vscode-webview://72db5b4c-61f8-400b-808c-771184cb3d7f/r68Zw7OChUZWvbD10qqmY`
    // href will contain the id of the note but it will NOT contain the vault
    // hence we should avoid the issue of parsing 'assets' vault name even if someone names their
    // vault 'assets'.
    return LinkType.ASSET;
  } else if (href && href.startsWith("vscode-webview")) {
    return LinkType.WIKI;
  } else if (
    href &&
    (href.startsWith("http://") || href.startsWith("https://"))
  ) {
    return LinkType.WEBSITE;
  } else {
    return LinkType.UNKNOWN;
  }
};

/** This wrapper class is mostly here to allow easier stubbing for testing. */
export class ShowPreviewNoteUtil {
  static getNoteById(id: string) {
    return getEngine().notes[id];
  }
}

export class ShowPreviewAssetOpener {
  static async openWithDefaultApp(filePath: string) {
    await open(filePath).catch((err) => {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.UNKNOWN,
        innerError: err,
      });
      Logger.error({ error });
    });
  }
}

const vaultlessAssetPath = ({
  data,
  wsRoot,
}: {
  data: NoteViewMessage["data"];
  wsRoot: string;
}) => {
  const assetPathRelative = data.href?.substring(data.href?.indexOf("assets/"));

  if (assetPathRelative === undefined) {
    Logger.info({
      msg: `Did not find 'assets/' string within asset type link.`,
    });
    return;
  }
  const noteId = data.id;
  if (noteId === undefined) {
    Logger.info({
      msg: `LinkData did not contain note id data:'${ErrorFactory.safeStringify(
        data
      )}'`,
    });
    return;
  }

  const note: NoteProps | undefined = ShowPreviewNoteUtil.getNoteById(noteId);
  if (note === undefined) {
    Logger.info({
      msg: `Note was not found for id: '${noteId}'`,
    });
    return;
  }

  const assetPathFull = path.join(
    vault2Path({ vault: note.vault, wsRoot }),
    assetPathRelative
  );

  return assetPathFull;
};

const handleAssetLink = async ({
  data,
  wsRoot,
}: {
  data: NoteViewMessage["data"];
  wsRoot: string;
}) => {
  const assetFullPath: undefined | string = vaultlessAssetPath({
    data,
    wsRoot,
  });

  if (assetFullPath === undefined) {
    Logger.error({
      msg: `Was not able to construct asset path for data:'${ErrorFactory.safeStringify(
        data
      )}' wsRoot:'${wsRoot}'`,
    });
    return;
  }

  await ShowPreviewAssetOpener.openWithDefaultApp(assetFullPath);
};

export const getNavigationTargetNoteForWikiLink = async ({
  data,
  notes,
}: {
  data: NoteViewMessage["data"];
  notes: NotePropsDict;
}) => {
  // wiki links will have the following format
  //
  // with `prettyLinks` set to false
  //    with anchor: vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/foo.html'
  //
  // with `prettyLinks` set to true
  //    with anchor: vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/foo'
  //    without anchor: vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/foo#foobar'
  //
  // And when the target of the link is a note in different vault without specifying
  // the vault explicitly the href is going to have the file name of the node in place of the id:
  // Example of href note inf different vault without vault specified:
  // vscode-webview://25d7783e-df29-479c-9838-386c17dbf9b6/dendron.ref.links.target-different-vault
  //
  if (!data.href) {
    throw ErrorFactory.createInvalidStateError({
      message: `href is missing from data: '${ErrorFactory.safeStringify(
        data
      )}'`,
    });
  }

  const noteId = extractNoteIdFromHref(data);
  if (!noteId) {
    throw ErrorFactory.createInvalidStateError({
      message: `Failed to extract noteId from '${ErrorFactory.safeStringify(
        data
      )}'`,
    });
  }

  const anchor = extractHeaderAnchorIfExists(data.href);
  let note: NoteProps | undefined = notes[noteId];

  if (note === undefined) {
    // If we could not find the note by the extracted id (when the note is within the same
    // vault we should have been able to find the note by id) there is a good chance that the name
    // of the note was in place of the id in the HREF (as in case of navigating to a note
    // in a different vault without explicit vault specification). Hence we will attempt
    // to find the note by file name.
    const candidates = NoteUtils.getNotesByFname({ fname: noteId, notes });

    if (candidates.length === 1) {
      note = candidates[0];
    } else if (candidates.length > 1) {
      // We have more than one candidate hence lets as the user which candidate they would like
      // to navigate to
      note = await QuickPickUtil.showChooseNote(candidates);
    }
  }

  return {
    note,
    anchor,
  };
};

export const handleLink = async ({
  linkType,
  data,
  wsRoot,
}: {
  linkType: LinkType;
  data: NoteViewMessage["data"];
  wsRoot: string;
}) => {
  switch (linkType) {
    case LinkType.ASSET: {
      await handleAssetLink({ data, wsRoot });
      break;
    }
    case LinkType.WIKI: {
      try {
        const noteData = await getNavigationTargetNoteForWikiLink({
          data,
          notes: getEngine().notes,
        });

        if (noteData.note === undefined) {
          // One valid case for note being undefined if user clicked on target note in
          // different vault which had ambiguous vault and upon being prompted
          // to select a note in quick user cancelled.
          return;
        }

        return new GotoNoteCommand().execute({
          qs: noteData.note.fname,
          vault: noteData.note.vault,
          column: vscode.ViewColumn.One,
          anchor: noteData.anchor,
        });
      } catch (err) {
        Logger.error({ error: ErrorFactory.wrapIfNeeded(err) });
        return;
      }
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
          await handleLink({
            linkType,
            data,
            wsRoot: getEngine().wsRoot,
          });
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
