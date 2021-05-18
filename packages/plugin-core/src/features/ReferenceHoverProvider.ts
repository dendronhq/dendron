import { DendronError, NoteUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { MarkdownPublishPod } from "@dendronhq/pods-core";
import fs from "fs";
import path from "path";
import vscode, { Uri } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import {
  containsImageExt,
  containsOtherKnownExts,
  getReferenceAtPosition,
  isUncPath,
} from "../utils/md";
import { DendronWorkspace, getWS } from "../workspace";

export default class ReferenceHoverProvider implements vscode.HoverProvider {
  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    const refAtPos = getReferenceAtPosition(document, position);

    if (refAtPos) {
      const { ref, range } = refAtPos;
      const hoverRange = new vscode.Range(
        new vscode.Position(range.start.line, range.start.character + 2),
        new vscode.Position(range.end.line, range.end.character - 2)
      );

      let foundUri: Uri;
      const engine = DendronWorkspace.instance().getEngine();

      if (containsImageExt(refAtPos.ref)) {
        // check for /assests
        // if (path.isAbsolute(refAtPos.ref)) {
        const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
        const vpath = vault2Path({ vault, wsRoot: DendronWorkspace.wsRoot() });
        const fullPath = path.join(vpath, refAtPos.ref);
        // }
        foundUri = Uri.file(fullPath);
      } else {
        const notes = NoteUtils.getNotesByFname({
          fname: refAtPos.ref,
          notes: engine.notes,
        });
        const uris = notes.map((note) =>
          Uri.file(
            NoteUtils.getFullPath({ note, wsRoot: DendronWorkspace.wsRoot() })
          )
        );
        foundUri = uris[0];
      }
      // start block

      //   const uris = getWorkspaceCache().allUris;
      //   const foundUri = findUriByRef(uris, ref);

      //   if (!foundUri && containsUnknownExt(ref)) {
      //     return new vscode.Hover(
      //       `Link contains unknown extension: ${
      //         path.parse(ref).ext
      //       }. Please use common file extensions ${commonExtsHint} to enable full support.`,
      //       hoverRange,
      //     );
      //   }

      if (foundUri && fs.existsSync(foundUri.fsPath)) {
        const imageMaxHeight = Math.max(
          200,
          //getMemoConfigProperty('links.preview.imageMaxHeight', 200),
          10
        );
        const getContent = async () => {
          if (containsImageExt(foundUri.fsPath)) {
            return `![${
              isUncPath(foundUri.fsPath)
                ? "UNC paths are not supported for images preview due to VSCode Content Security Policy. Use markdown preview or open image via cmd (ctrl) + click instead."
                : ""
            }](${vscode.Uri.file(
              foundUri.fsPath
            ).toString()}|height=${imageMaxHeight})`;
          } else if (containsOtherKnownExts(foundUri.fsPath)) {
            const ext = path.parse(foundUri.fsPath).ext;
            return `Preview is not supported for "${ext}" file type. Click to open in the default app.`;
          }

          const fname = path.basename(foundUri.fsPath, ".md");
          const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
          const note = NoteUtils.getNoteByFnameV5({
            fname,
            vault,
            notes: getWS().getEngine().notes,
            wsRoot: DendronWorkspace.wsRoot(),
          });
          if (!note) {
            throw new DendronError({ message: `note ${fname} not found` });
          }
          const out = await new MarkdownPublishPod().plant({
            note,
            config: {
              fname,
              dest: "stdout",
              vault: PickerUtilsV2.getOrPromptVaultForOpenEditor(),
            },
            engine: getWS().getEngine(),
            vaults: getWS().vaultsv4,
            wsRoot: DendronWorkspace.wsRoot(),
          });

          return out;
        };
        const content = await getContent();

        return new vscode.Hover(content, hoverRange);
      }

      return new vscode.Hover(`"${ref}" is not created yet`, hoverRange);
    }

    return null;
  }
}
