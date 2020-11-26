import { NoteUtilsV2 } from "@dendronhq/common-all";
import { MarkdownPublishPod } from "@dendronhq/pods-core";
import fs from "fs";
import path from "path";
import vscode, { Uri } from "vscode";
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

      // if (containsNonMdExt(ref)) {
      //   let fpath: string | undefined;
      //   const v = _.find(engine.vaultsv3, (v) => {
      //     fpath = path.join(resolveRelToWSRoot(v.fsPath), ref);
      //     return fs.existsSync(fpath);
      //   });
      //   if (v && fpath) {
      //     foundUri = Uri.file(fpath);
      //   } else {
      //     return new vscode.Hover(
      //       `"${ref}" is not created yet. Click to create.`,
      //       hoverRange
      //     );
      //   }
      if (containsImageExt(refAtPos.ref)) {
        foundUri = Uri.file(refAtPos.ref);
      } else {
        const notes = NoteUtilsV2.getNotesByFname({
          fname: refAtPos.ref,
          notes: engine.notes,
        });
        const uris = notes.map((note) =>
          Uri.file(NoteUtilsV2.getPath({ note }))
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
          const out = await new MarkdownPublishPod().plant({
            config: {
              fname,
              dest: "stdout",
            },
            engine: getWS().getEngine(),
            vaults: getWS().vaults,
            wsRoot: DendronWorkspace.wsRoot(),
          });

          return out;
        };
        const content = await getContent();

        return new vscode.Hover(content, hoverRange);
      }

      return new vscode.Hover(
        `"${ref}" is not created yet. Click to create.`,
        hoverRange
      );
    }

    return null;
  }
}
