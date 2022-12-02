import {
  ConfigUtils,
  containsNonDendronUri,
  DendronError,
  DVault,
  NotePropsMeta,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { findNonNoteFile, vault2Path } from "@dendronhq/common-server";
import { AnchorUtils, DendronASTDest, ProcFlavor } from "@dendronhq/unified";
import * as Sentry from "@sentry/node";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import vscode, { MarkdownString, Uri } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import {
  containsImageExt,
  getReferenceAtPosition,
  getReferenceAtPositionResp,
  isUncPath,
} from "../utils/md";

const HOVER_IMAGE_MAX_HEIGHT = Math.max(200, 10);

export default class ReferenceHoverProvider implements vscode.HoverProvider {
  private async provideHoverNonNote({
    refAtPos,
    vault,
  }: {
    refAtPos: NonNullable<getReferenceAtPositionResp>;
    vault?: DVault;
  }): Promise<string | MarkdownString> {
    const ws = ExtensionProvider.getDWorkspace();
    const { wsRoot } = ws;
    const config = await ws.config;
    const vpath = vault2Path({
      vault: await PickerUtilsV2.getVaultForOpenEditor(),
      wsRoot,
    });
    const fullPath = path.join(vpath, refAtPos.ref);
    const foundUri = Uri.file(fullPath);

    // Handle URI's like https://example.com or mailto:user@example.com
    const nonDendronURIMessage = this.handleNonDendronUri(refAtPos.refText);
    if (!_.isUndefined(nonDendronURIMessage)) return nonDendronURIMessage;

    if (isUncPath(foundUri.fsPath))
      return "UNC paths are not supported for images preview due to VSCode Content Security Policy. Use markdown preview or open image via cmd (ctrl) + click instead.";

    if (containsImageExt(foundUri.fsPath)) {
      // This is an image that the preview supports
      if (!(await fs.pathExists(foundUri.fsPath))) {
        // Warn the user if the image is missing
        return `file ${foundUri.fsPath} in reference ${refAtPos.ref} is missing`;
      }
      return `![](${foundUri.toString()}|height=${HOVER_IMAGE_MAX_HEIGHT})`;
    }

    // Could be some other type of non-note file.
    const nonNoteFile = await this.maybeFindNonNoteFile(refAtPos, vault);
    if (nonNoteFile) {
      return `Preview is not supported for this link. [Click to open in the default app](${nonNoteFile}).`;
    }

    // Otherwise, this is a note link, but the note doesn't exist (otherwise `provideHover` wouldn't call this function).
    // Also let the user know if the file name is valid
    const validationResp = NoteUtils.validateFname(refAtPos.ref);
    const vaultName = refAtPos.vaultName
      ? ` in vault "${refAtPos.vaultName}"`
      : "";
    if (validationResp.isValid) {
      const autoCreateOnDefinition =
        ConfigUtils.getWorkspace(config).enableAutoCreateOnDefinition;
      const ctrlClickToCreate = autoCreateOnDefinition ? "Ctrl+Click or " : "";
      return `Note ${refAtPos.ref}${vaultName} is missing, ${ctrlClickToCreate}use "Dendron: Go to Note" command to create it.`;
    } else {
      return new MarkdownString(
        `Note \`${
          refAtPos.ref
        }${vaultName}\` is missing, and the filename is invalid for the following reason:\n\n \`${
          validationResp.reason
        }\`.\n\n Maybe you meant \`${NoteUtils.cleanFname({
          fname: refAtPos.ref,
        })}\`?`
      );
    }
  }

  /** Returns a message if this is a non-dendron URI. */
  private handleNonDendronUri(refText: string): string | undefined {
    const [first, second] = refText.split("|");
    const maybeUri = second || first;
    const maybe = containsNonDendronUri(maybeUri);
    // Not a URI, or is dendron://, so it must be a note (or image) and the rest of the code can handle this.
    if (_.isUndefined(maybe) || !maybe) return undefined;
    // Otherwise, this is a URI like http://example.com or mailto:user@example.com
    return `Preview is not supported for this link. [Click to open in the default app.](${maybeUri}).`;
  }

  private async maybeFindNonNoteFile(
    refAtPos: NonNullable<getReferenceAtPositionResp>,
    vault?: DVault
  ) {
    const ws = ExtensionProvider.getDWorkspace();
    const { wsRoot } = ws;
    const vaults = await ws.vaults;
    // This could be a non-note file
    // Could be a non-note file link
    const nonNoteFile = await findNonNoteFile({
      fpath: refAtPos.ref,
      vaults: vault ? [vault] : vaults,
      wsRoot,
    });
    return nonNoteFile?.fullPath;
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Hover | null> {
    try {
      const ctx = "provideHover";

      // No-op if we're not in a Dendron Workspace
      if (
        !(await ExtensionProvider.isActiveAndIsDendronNote(document.uri.fsPath))
      ) {
        return null;
      }

      const ws = ExtensionProvider.getDWorkspace();
      const { wsRoot } = ws;
      const vaults = await ws.vaults;

      const refAtPos = await getReferenceAtPosition({
        document,
        position,
        wsRoot,
        vaults,
      });
      if (!refAtPos) return null;
      const { range } = refAtPos;
      const hoverRange = new vscode.Range(
        new vscode.Position(range.start.line, range.start.character + 2),
        new vscode.Position(range.end.line, range.end.character - 2)
      );

      const engine = ExtensionProvider.getEngine();
      let vault: DVault | undefined;

      if (refAtPos.vaultName) {
        // If the link specifies a vault, we should only look at that vault
        const maybeVault = VaultUtils.getVaultByName({
          vname: refAtPos.vaultName,
          vaults: engine.vaults,
        });
        if (_.isUndefined(maybeVault)) {
          Logger.info({
            ctx,
            msg: "vault specified in link is missing",
            refAtPos,
          });
          return new vscode.Hover(
            `Vault ${refAtPos.vaultName} does not exist.`,
            hoverRange
          );
        }
        vault = maybeVault;
      }

      // Check if what's being referenced is a note.
      // If vault is specified, search only that vault. Otherwise search all vaults.
      let note: NotePropsMeta;
      const maybeNotes = await engine.findNotesMeta({
        fname: refAtPos.ref,
        vault,
      });
      if (maybeNotes.length === 0) {
        // If it isn't, then it might be an image, a URL like https://example.com, or some other file that we can't preview.
        return new vscode.Hover(
          await this.provideHoverNonNote({ refAtPos }),
          hoverRange
        );
      } else if (maybeNotes.length > 1) {
        // If there are multiple notes with this fname, default to one that's in the same vault first.
        const currentVault = await PickerUtilsV2.getVaultForOpenEditor();
        const sameVaultNote = _.filter(maybeNotes, (note) =>
          VaultUtils.isEqual(note.vault, currentVault, engine.wsRoot)
        )[0];
        if (!_.isUndefined(sameVaultNote)) {
          // There is a note that's within the same vault, let's go with that.
          note = sameVaultNote;
        } else {
          // Otherwise, just pick one, doesn't matter which.
          note = maybeNotes[0];
        }
      } else {
        // Just 1 note, use that.
        note = maybeNotes[0];
      }

      // For notes, let's use the noteRef functionality to render the referenced portion. ^tiagtt7sjzyw
      const referenceText = ["![["];
      if (refAtPos.vaultName)
        referenceText.push(`dendron://${refAtPos.vaultName}/`);
      referenceText.push(refAtPos.ref);
      if (refAtPos.anchorStart)
        referenceText.push(
          `#${AnchorUtils.anchor2string(refAtPos.anchorStart)}`
        );
      if (refAtPos.anchorEnd)
        referenceText.push(
          `:#${AnchorUtils.anchor2string(refAtPos.anchorEnd)}`
        );
      referenceText.push("]]");
      const reference = referenceText.join("");
      // now we create a fake note so we can pass this to the engine
      const id = `note.id-${reference}`;
      const fakeNote = NoteUtils.createForFake({
        // Mostly same as the note...
        fname: note.fname,
        vault: note.vault,
        // except the changed ID to avoid caching
        id,
        // And using the reference as the text of the note
        contents: reference,
      });
      const rendered = await engine.renderNote({
        id: fakeNote.id,
        note: fakeNote,
        dest: DendronASTDest.MD_REGULAR,
        flavor: ProcFlavor.HOVER_PREVIEW,
      });
      if (rendered.error) {
        const error =
          rendered.error instanceof DendronError
            ? rendered.error
            : new DendronError({
                message: "Error while rendering hover",
                payload: rendered.error,
              });
        Sentry.captureException(error);
        Logger.error({
          ctx,
          msg: "Error while rendering the hover",
          error,
        });
      }
      if (rendered.data) {
        const markdownString = new MarkdownString(rendered.data);

        // Support the usage of command URI's for gotoNote navigation
        markdownString.isTrusted = true;
        return new vscode.Hover(markdownString, hoverRange);
      }
      return null;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
}
