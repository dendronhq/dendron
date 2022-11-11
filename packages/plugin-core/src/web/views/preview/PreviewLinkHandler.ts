import {
  DLogger,
  DNoteAnchorBasic,
  ErrorFactory,
  isVSCodeCommandUri,
  isWebUri,
  NotePropsMeta,
  NoteViewMessage,
  ReducedDEngine,
  URI,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import { AnchorUtils } from "@dendronhq/unified";
import _ from "lodash";
import {
  IPreviewLinkHandler,
  LinkType,
} from "../../../components/views/IPreviewLinkHandler";
import { inject, injectable } from "tsyringe";
import { Utils } from "vscode-uri";
import { openNote } from "../../utils/openNote";

/**
 * Web extension implementation for handling link clicks in preview
 */
@injectable()
export class PreviewLinkHandler implements IPreviewLinkHandler {
  constructor(
    @inject("wsRoot") private wsRoot: URI,
    @inject("ReducedDEngine") private engine: ReducedDEngine,
    @inject("logger") private logger: DLogger
  ) {}

  public async onLinkClicked({
    data,
  }: {
    data: { id?: string | undefined; href?: string | undefined };
  }) {
    const ctx = "PreviewLinkHandler.onLinkClicked";
    // If href is missing, something is wrong with our link handler. Just let the VSCode's default handle it.
    if (!data.href) return LinkType.UNKNOWN;
    // First check if it's a web URL.

    if (isWebUri(data.href)) {
      // There's nothing to do then, the default handler opens them automatically.
      // If we try to open it too, it will open twice.
      return LinkType.WEBSITE;
    }

    if (isVSCodeCommandUri(data.href)) {
      // If it's a command uri, do nothing.
      // Let VSCode handle them.

      return LinkType.COMMAND;
    }

    // const uri = vscode.Uri.parse(data.href);
    // First, check if the URL matches any note
    try {
      const noteData = await this.getNavigationTargetNoteForWikiLink({
        data,
      });

      if (noteData.note) {
        // Found a note, open that
        openNote({
          wsRoot: this.wsRoot,
          fname: noteData.note.fname,
          vault: noteData.note.vault,
          note: noteData.note,
          column: vscode.ViewColumn.One,
          anchor: noteData.anchor,
        });
        return LinkType.WIKI;
      }
    } catch (err) {
      this.logger.debug({ ctx, error: ErrorFactory.wrapIfNeeded(err) });
    }

    // TODO: Add back functionality
    // // If not, see if there's a matching asset (including in assets folder, outside vaults, or even an absolute path)
    // const currentNote = data?.id
    //  ? (await this._ext.getEngine().getNoteMeta(data.id)).data
    //  : undefined;
    // const { fullPath } =
    //   (await findNonNoteFile({
    //     fpath: path.normalize(uri.fsPath),
    //     vaults: this.vaults,
    //     wsRoot: this.wsRoot,
    //     currentVault: currentNote?.vault,
    //   })) || {};
    // if (fullPath) {
    //   // Found a matching non-note file.
    //   if (FileExtensionUtils.isTextFileExtension(path.extname(fullPath))) {
    //     // If it's a text file, open it inside VSCode.
    //     const editor = await VSCodeUtils.openFileInEditor(
    //       vscode.Uri.file(fullPath),
    //       {
    //         // Avoid replacing the preview
    //         column: vscode.ViewColumn.One,
    //       }
    //     );
    //     if (!_.isEmpty(uri.fragment) && editor) {
    //       const anchor = AnchorUtils.string2anchor(uri.fragment);
    //       await this._ext.wsUtils.trySelectRevealNonNoteAnchor(editor, anchor);
    //     }
    //     return LinkType.TEXT;
    //   } else {
    //     // Otherwise it's a binary file, try to open it with the default program
    //     ShowPreviewAssetOpener.openWithDefaultApp(path.normalize(fullPath));
    //     return LinkType.ASSET;
    //   }
    // }
    // If nothing applies, VSCode's default will hopefully handle it
    this.logger.debug({
      ctx,
      msg: "Nothing applied for the URL, had to fall back to VSCode default.",
    });
    return LinkType.UNKNOWN;
  }

  /**
   * Try to find the note to navigate to if the given path references a note.
   * @returns a note if one was found, `undefined` if no notes were found, and
   * `null` if the link was ambiguous and user cancelled the prompt to pick a
   * note.
   */
  public async getNavigationTargetNoteForWikiLink({
    data,
  }: // engine,
  {
    data: NoteViewMessage["data"];
    // engine: DEngineClient;
  }): Promise<{
    note: NotePropsMeta | undefined;
    anchor: DNoteAnchorBasic | undefined;
  }> {
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

    const anchor = AnchorUtils.string2anchor(
      vscode.Uri.parse(data.href).fragment
    );

    const resp = await this.engine.getNoteMeta(noteId);

    let note;
    if (resp.data) {
      note = resp.data;
    } else {
      // If we could not find the note by the extracted id (when the note is within the same
      // vault we should have been able to find the note by id) there is a good chance that the name
      // of the note was in place of the id in the HREF (as in case of navigating to a note
      // in a different vault without explicit vault specification). Hence we will attempt
      // to find the note by file name.
      const candidates = await this.engine.findNotesMeta({ fname: noteId });

      note = candidates[0];
      // TODO: Add back quickpicker functionality in case there are multiple candidates:
      // if (candidates.length === 1) {
      //   note = candidates[0];
      // } else if (candidates.length > 1) {
      //   // We have more than one candidate hence lets as the user which candidate they would like
      //   // to navigate to
      //   note = await QuickPickUtil.showChooseNote(candidates);
      //   if (note === undefined) note = null;
      // }
    }

    return {
      note,
      anchor,
    };
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
    const path = vscode.Uri.parse(data.href);
    const out = _.trimEnd(Utils.basename(path), ".html");
    return out;
  }
}
