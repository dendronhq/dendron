import { DVault, NoteUtils, VaultUtils } from "@dendronhq/common-all";
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

const HOVER_IMAGE_MAX_HEIGHT = Math.max(200, 10);

export default class ReferenceHoverProvider implements vscode.HoverProvider {
  private async provideHoverNonNote({
    refAtPos,
    vault,
  }: {
    refAtPos: NonNullable<ReturnType<typeof getReferenceAtPosition>>;
    vault: DVault;
  }): Promise<string> {
    const vpath = vault2Path({ vault, wsRoot: DendronWorkspace.wsRoot() });
    const fullPath = path.join(vpath, refAtPos.ref);
    const foundUri = Uri.file(fullPath);

    // Handle URI's like https://example.com or mailto:user@example.com
    const nonDendronURIMessage = this.handleNonDendronUri(refAtPos.refText);
    if (!_.isUndefined(nonDendronURIMessage)) return nonDendronURIMessage;

    // Not a URI, and the file doesn't exist
    if (!(await fs.pathExists(foundUri.fsPath)))
      return `"file ${foundUri.fsPath} in reference ${refAtPos.ref} is missing`;

    if (isUncPath(foundUri.fsPath))
      return "UNC paths are not supported for images preview due to VSCode Content Security Policy. Use markdown preview or open image via cmd (ctrl) + click instead.";

    if (containsImageExt(foundUri.fsPath)) {
      // File exists and is an image type that the preview supports.
      return `![](${foundUri.toString()}|height=${HOVER_IMAGE_MAX_HEIGHT})`;
    } else {
      // File exists, but we can't preview it. Just inform the user.
      const ext = path.parse(foundUri.fsPath).ext;
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
    const refAtPos = getReferenceAtPosition(document, position);
    if (!refAtPos) return null;
    const { range } = refAtPos;
    const hoverRange = new vscode.Range(
      new vscode.Position(range.start.line, range.start.character + 2),
      new vscode.Position(range.end.line, range.end.character - 2)
    );

    const engine = getEngine();
    const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();

    // Check if what's being referenced is a note.
    const maybeNotes = NoteUtils.getNotesByFname({
      fname: refAtPos.ref,
      notes: engine.notes,
      // If vault is specified, search only that vault. Otherwise search all vaults.
      vault: refAtPos.vaultName
        ? VaultUtils.getVaultByName({
            vname: refAtPos.vaultName,
            vaults: engine.vaults,
          })
        : undefined,
    });
    // If it isn't, then it might be an image, a URL like https://example.com, or some other file that we can't preview.
    if (maybeNotes.length === 0)
      return new vscode.Hover(
        await this.provideHoverNonNote({ refAtPos, vault }),
        hoverRange
      );
    const note = maybeNotes[0];

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

    const reference = await proc.process(referenceText.join(""));
    return new vscode.Hover(reference.toString(), hoverRange);
  }
}
