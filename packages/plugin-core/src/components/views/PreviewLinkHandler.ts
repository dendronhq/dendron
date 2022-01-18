import {
  DendronError,
  DNoteAnchor,
  ErrorFactory,
  ERROR_STATUS,
  NoteProps,
  NotePropsDict,
  NoteUtils,
  NoteViewMessage,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import path from "path";
import * as vscode from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { Logger } from "../../logger";
import { QuickPickUtil } from "../../utils/quickPick";
import { VSCodeUtils } from "../../vsCodeUtils";
import open from "open";

export enum LinkType {
  WIKI = "WIKI",
  ASSET = "ASSET",
  WEBSITE = "WEBSITE",
  MARKDOWN = "MARKDOWN",
  UNKNOWN = "UNKNOWN",
}

/**
 * Interface for handling preview link click events
 */
export interface IPreviewLinkHandler {
  /**
   * Handle the event of a user clicking on a link in the preview webview pane
   * @param param0
   */
  onLinkClicked({ data }: { data: NoteViewMessage["data"] }): Promise<void>;
}

/**
 * Default implementation for handling link clicks in preview
 */
export class PreviewLinkHandler implements IPreviewLinkHandler {
  private _ext: IDendronExtension;
  constructor(ext: IDendronExtension) {
    this._ext = ext;
  }

  public async onLinkClicked({
    data,
  }: {
    data: { id?: string | undefined; href?: string | undefined };
  }): Promise<void> {
    const linkType = this.classifyLink(data);

    switch (linkType) {
      case LinkType.ASSET: {
        await this.handleAssetLink({
          data,
          wsRoot: this._ext.getDWorkspace().wsRoot,
        });
        break;
      }
      case LinkType.WIKI: {
        try {
          const noteData = await this.getNavigationTargetNoteForWikiLink({
            data,
            notes: this._ext.getEngine().notes,
          });

          if (noteData.note === undefined) {
            // One valid case for note being undefined if user clicked on target note in
            // different vault which had ambiguous vault and upon being prompted
            // to select a note in quick user cancelled.
            return;
          }

          this._ext.commandFactory.goToNoteCmd().execute({
            qs: noteData.note.fname,
            vault: noteData.note.vault,
            column: vscode.ViewColumn.One,
            anchor: noteData.anchor,
          });

          return;
        } catch (err) {
          Logger.error({ error: ErrorFactory.wrapIfNeeded(err) });
          return;
        }
      }
      case LinkType.WEBSITE: {
        // Updated preview appears to already open the external links in the browser by itself
        // Hence running `VSCodeUtils.openLink(data.href!);` causes double opening
        // of the link within the browser.
        return;
      }
      case LinkType.MARKDOWN: {
        // assume local note - open relative to current vault
        const note = this._ext.getEngine().notes[data.id!];
        if (!note) return;

        // noteId in this case is name of file
        const fullPath = path.join(
          this._ext.getEngine().wsRoot,
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
  }

  public classifyLink({ href }: NoteViewMessage["data"]): LinkType {
    if (
      href &&
      href.startsWith("vscode-webview") &&
      href.includes("/assets/")
    ) {
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
  }

  public async getNavigationTargetNoteForWikiLink({
    data,
    notes,
  }: {
    data: NoteViewMessage["data"];
    notes: NotePropsDict;
  }) {
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

    const noteId = this.extractNoteIdFromHref(data);
    if (!noteId) {
      throw ErrorFactory.createInvalidStateError({
        message: `Failed to extract noteId from '${ErrorFactory.safeStringify(
          data
        )}'`,
      });
    }

    const anchor = this.extractHeaderAnchorIfExists(data.href);
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
  }

  private async handleAssetLink({
    data,
    wsRoot,
  }: {
    data: NoteViewMessage["data"];
    wsRoot: string;
  }) {
    const assetFullPath: undefined | string = this.vaultlessAssetPath({
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
  }

  public extractNoteIdFromHref(data: {
    id?: string;
    href?: string;
  }): string | undefined {
    if (data.href === undefined) {
      throw ErrorFactory.createInvalidStateError({
        message: `href is missing.`,
      });
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
  }

  public extractHeaderAnchorIfExists(link: string): DNoteAnchor | undefined {
    if (link.indexOf("#") === -1) {
      return undefined;
    } else {
      const tokens = link.split("#");
      const anchorValue = tokens[tokens.length - 1];
      return {
        type: "header",
        value: anchorValue,
        depth: tokens.length - 1,
      };
    }
  }

  private vaultlessAssetPath({
    data,
    wsRoot,
  }: {
    data: NoteViewMessage["data"];
    wsRoot: string;
  }) {
    const assetPathRelative = data.href?.substring(
      data.href?.indexOf("assets/")
    );

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
    const note: NoteProps | undefined = this._ext.getEngine().notes[noteId];
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
