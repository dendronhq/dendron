import { getSlugger } from "@dendronhq/common-all";
import * as Sentry from "@sentry/node";
import _ from "lodash";
import vscode from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { EditorUtils } from "../utils/EditorUtils";
import { findReferences, getReferenceAtPosition } from "../utils/md";
import { WSUtilsV2 } from "../WSUtilsV2";

export default class ReferenceProvider implements vscode.ReferenceProvider {
  public async provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    try {
      // No-op if dendron isn't active
      if (
        !(await ExtensionProvider.isActiveAndIsDendronNote(document.uri.fsPath))
      ) {
        return null;
      }

      const ws = ExtensionProvider.getDWorkspace();
      const { wsRoot } = ws;
      const vaults = await ws.vaults;
      // provide reference to header if selection is header.
      const header = EditorUtils.getHeaderAt({ document, position });
      if (!_.isUndefined(header)) {
        const note = await new WSUtilsV2(
          ExtensionProvider.getExtension()
        ).getNoteFromDocument(document);
        const references = await findReferences(note!.fname);
        return references
          .filter((reference) => {
            const matchText = reference.matchText;
            const REGEX = new RegExp("\\[\\[(?<linkContent>.*)\\]\\]");
            const match = REGEX.exec(matchText);
            return (
              match?.groups &&
              match.groups["linkContent"].split("#")[1] ===
                getSlugger().slug(header)
            );
          })
          .map((reference) => {
            return reference.location;
          });
      }

      const refAtPos = await getReferenceAtPosition({
        document,
        position,
        wsRoot,
        vaults,
      });

      return refAtPos
        ? (await findReferences(refAtPos.ref)).map(({ location }) => location)
        : [];
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
}
