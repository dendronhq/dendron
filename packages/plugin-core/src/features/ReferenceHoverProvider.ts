import { DVault, NoteProps, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import {
  DendronASTDest,
  AnchorUtils,
  MDUtilsV5,
  ProcFlavor,
} from "@dendronhq/engine-server";
import path from "path";
import vscode, { Uri } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import {
  containsImageExt,
  containsNonDendronUri,
  getReferenceAtPosition,
  isUncPath,
} from "../utils/md";
import { DendronWorkspace, getEngine } from "../workspace";
import _ from "lodash";
import { Logger } from "../logger";

const HOVER_IMAGE_MAX_HEIGHT = Math.max(200, 10);

export default class ReferenceHoverProvider implements vscode.HoverProvider {
  private async provideHoverNonNote({
    refAtPos,
  }: {
    refAtPos: NonNullable<ReturnType<typeof getReferenceAtPosition>>;
  }): Promise<string> {
    const vpath = vault2Path({ vault: PickerUtilsV2.getVaultForOpenEditor(), wsRoot: DendronWorkspace.wsRoot() });
    const fullPath = path.join(vpath, refAtPos.ref);
    const foundUri = Uri.file(fullPath);

    // Handle URI's like https://example.com or mailto:user@example.com
    const nonDendronURIMessage = this.handleNonDendronUri(refAtPos.refText);
    if (!_.isUndefined(nonDendronURIMessage)) return nonDendronURIMessage;

    if (isUncPath(foundUri.fsPath))
      return "UNC paths are not supported for images preview due to VSCode Content Security Policy. Use markdown preview or open image via cmd (ctrl) + click instead.";

    if (containsImageExt(foundUri.fsPath)) {
      // File exists and is an image type that the preview supports.
      if (!(await fs.pathExists(foundUri.fsPath))) {
        return `file ${foundUri.fsPath} in reference ${refAtPos.ref} is missing`;
      }
      return `![](${foundUri.toString()}|height=${HOVER_IMAGE_MAX_HEIGHT})`;
    } else {
      // File exists, but we can't preview it. Just inform the user.
      const ext = path.parse(foundUri.fsPath).ext;
      if (ext === "") {
        // No extension, this is probably not a file but instead a broken note link.
        return `Note ${refAtPos.ref}${refAtPos.vaultName ? " in vault " + refAtPos.vaultName : ""} is missing, Ctrl+click or use "Dendron: Goto Note" command to create it.`;
      }
      return `Preview is not supported for "${ext}" file type. [Click to open in the default app](${foundUri.toString()}).`;
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

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Hover | null> {
    const ctx = "provideHover";
    const refAtPos = getReferenceAtPosition(document, position);
    if (!refAtPos) return null;
    const { range } = refAtPos;
    const hoverRange = new vscode.Range(
      new vscode.Position(range.start.line, range.start.character + 2),
      new vscode.Position(range.end.line, range.end.character - 2)
    );

    const engine = getEngine();
    let vault: DVault | undefined;

    if (refAtPos.vaultName) {
      // If the link specifies a vault, we should only look at that vault
      const maybeVault = VaultUtils.getVaultByName({
        vname: refAtPos.vaultName,
        vaults: engine.vaults,
      });
      if (_.isUndefined(maybeVault)) {
        Logger.info({ ctx, msg: "vault specified in link is missing", refAtPos});
        return new vscode.Hover(
          `Vault ${refAtPos.vaultName} does not exist.`,
          hoverRange,
        );
      }
      vault = maybeVault;
    }

    // Check if what's being referenced is a note.
    let note: NoteProps;
    const maybeNotes = NoteUtils.getNotesByFname({
      fname: refAtPos.ref,
      notes: engine.notes,
      // If vault is specified, search only that vault. Otherwise search all vaults.
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
      const currentVault = PickerUtilsV2.getVaultForOpenEditor();
      const sameVaultNote = _.filter(maybeNotes, (note) => VaultUtils.isEqual(note.vault,  currentVault, engine.wsRoot))[0];
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

    // For notes, let's use the noteRef functionality to render the referenced portion
    const proc = MDUtilsV5.procRemarkFull({
      dest: DendronASTDest.MD_REGULAR,
      engine,
      vault: note.vault,
      fname: note.fname,
    }, {
      flavor: ProcFlavor.HOVER_PREVIEW,
    });
    const referenceText = ["![["];
    if (refAtPos.vaultName)
      referenceText.push(`dendron://${refAtPos.vaultName}/`);
    referenceText.push(refAtPos.ref);
    if (refAtPos.anchorStart)
      referenceText.push(`#${AnchorUtils.anchor2string(refAtPos.anchorStart)}`);
    if (refAtPos.anchorEnd)
      referenceText.push(`:#${AnchorUtils.anchor2string(refAtPos.anchorEnd)}`);
    referenceText.push("]]");

    try {
      const reference = await proc.process(referenceText.join(""));
      return new vscode.Hover(reference.toString(), hoverRange);
    } catch (err) {
      Logger.info({ctx, referenceText: referenceText.join(""), refAtPos, err});
      return null;
    }
  }
}
