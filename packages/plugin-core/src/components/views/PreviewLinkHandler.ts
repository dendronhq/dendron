import {
  DEngineClient,
  DNoteAnchorBasic,
  ErrorFactory,
  isVSCodeCommandUri,
  isWebUri,
  NotePropsMeta,
  NoteViewMessage,
  TutorialEvents,
} from "@dendronhq/common-all";
import { FileExtensionUtils, findNonNoteFile } from "@dendronhq/common-server";
import path from "path";
import * as vscode from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { Logger } from "../../logger";
import { QuickPickUtil } from "../../utils/quickPick";
import { VSCodeUtils } from "../../vsCodeUtils";
import { AnchorUtils } from "@dendronhq/unified";
import _ from "lodash";
import { PluginFileUtils } from "../../utils/files";
import { GotoNoteCommand } from "../../commands/GotoNote";
import { AnalyticsUtils } from "../../utils/analytics";
import { ExtensionUtils } from "../../utils/ExtensionUtils";
import { IPreviewLinkHandler, LinkType } from "./IPreviewLinkHandler";

/**
 * Default implementation for handling link clicks in preview
 */
export class PreviewLinkHandler implements IPreviewLinkHandler {
  private _ext: IDendronExtension;
  /**
   * set of tutorial note ids that we will allow tracking of link clicked events.
   * TODO: consolidate tracking of tutorial ids to a central place
   * TODO: this logic is specific to the tutorial workspace
   *       add a way to register callbacks to the link handler in the future
   */
  private _trackAllowedIds = ExtensionUtils.getTutorialIds();

  constructor(ext: IDendronExtension) {
    this._ext = ext;
  }

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

      // track the link if it comes from a tutorial
      // TODO: this logic is specific to the tutorial workspace
      //       add a way to register callbacks to the link handler in the future
      if (data.id && this._trackAllowedIds.has(data.id)) {
        AnalyticsUtils.track(TutorialEvents.TutorialPreviewLinkClicked, {
          LinkType: LinkType.WEBSITE,
          href: data.href,
        });
        // some questions signal intent
        if (data.href.endsWith("98f6d928-3f61-49fb-9c9e-70c27d25f838")) {
          AnalyticsUtils.identify({ teamIntent: true });
        }
      }
      return LinkType.WEBSITE;
    }

    if (isVSCodeCommandUri(data.href)) {
      // If it's a command uri, do nothing.
      // Let VSCode handle them.

      // but track the command uri if it comes from a tutorial
      // TODO: this logic is specific to the tutorial workspace
      //       add a way to register callbacks to the link handler in the future
      if (data.id && this._trackAllowedIds.has(data.id)) {
        AnalyticsUtils.track(TutorialEvents.TutorialPreviewLinkClicked, {
          LinkType: LinkType.COMMAND,
          href: data.href,
        });
      }
      return LinkType.COMMAND;
    }

    const uri = vscode.Uri.parse(data.href);
    // First, check if the URL matches any note
    try {
      const noteData = await this.getNavigationTargetNoteForWikiLink({
        data,
        engine: this._ext.getEngine(),
      });

      if (noteData.note) {
        // Found a note, open that
        const cmd = new GotoNoteCommand(this._ext);

        await cmd.execute({
          qs: noteData.note.fname,
          vault: noteData.note.vault,
          // Avoid replacing the preview
          column: vscode.ViewColumn.One,
          anchor: noteData.anchor,
        });
        return LinkType.WIKI;
      }
    } catch (err) {
      Logger.debug({ ctx, error: ErrorFactory.wrapIfNeeded(err) });
    }
    // If not, see if there's a matching asset (including in assets folder, outside vaults, or even an absolute path)
    const { wsRoot, vaults } = this._ext.getDWorkspace();
    const currentNote = data?.id
      ? (await this._ext.getEngine().getNoteMeta(data.id)).data
      : undefined;
    const { fullPath } =
      (await findNonNoteFile({
        fpath: path.normalize(uri.fsPath),
        vaults,
        wsRoot,
        currentVault: currentNote?.vault,
      })) || {};
    if (fullPath) {
      // Found a matching non-note file.
      if (FileExtensionUtils.isTextFileExtension(path.extname(fullPath))) {
        // If it's a text file, open it inside VSCode.
        const editor = await VSCodeUtils.openFileInEditor(
          vscode.Uri.file(fullPath),
          {
            // Avoid replacing the preview
            column: vscode.ViewColumn.One,
          }
        );
        if (!_.isEmpty(uri.fragment) && editor) {
          const anchor = AnchorUtils.string2anchor(uri.fragment);
          await this._ext.wsUtils.trySelectRevealNonNoteAnchor(editor, anchor);
        }
        return LinkType.TEXT;
      } else {
        // Otherwise it's a binary file, try to open it with the default program
        ShowPreviewAssetOpener.openWithDefaultApp(path.normalize(fullPath));
        return LinkType.ASSET;
      }
    }
    // If nothing applies, VSCode's default will hopefully handle it
    Logger.debug({
      ctx,
      msg: "Nothing applied for the URL, had to fall back to VSCode default.",
    });
    return LinkType.UNKNOWN;
  }

  /** Try to find the note to navigate to if the given path references a note.
   *
   * @returns a note if one was found, `undefined` if no notes were found, and
   * `null` if the link was ambiguous and user cancelled the prompt to pick a
   * note.
   */
  public async getNavigationTargetNoteForWikiLink({
    data,
    engine,
  }: {
    data: NoteViewMessage["data"];
    engine: DEngineClient;
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
    let note = (await engine.getNoteMeta(noteId)).data;

    if (note === undefined) {
      // If we could not find the note by the extracted id (when the note is within the same
      // vault we should have been able to find the note by id) there is a good chance that the name
      // of the note was in place of the id in the HREF (as in case of navigating to a note
      // in a different vault without explicit vault specification). Hence we will attempt
      // to find the note by file name.
      const candidates = await engine.findNotes({ fname: noteId });

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
}

export class ShowPreviewAssetOpener {
  static openWithDefaultApp = PluginFileUtils.openWithDefaultApp;
}
