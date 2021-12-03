import vscode from "vscode";
import { findReferences, getReferenceAtPosition } from "../utils/md";
import * as Sentry from "@sentry/node";
import { DendronExtension } from "../workspace";
import { getHeaderAt } from "../utils/editor";
import _ from "lodash";

import { getSlugger } from "@dendronhq/common-all";
import { WSUtils } from "../WSUtils";

export default class ReferenceProvider implements vscode.ReferenceProvider {
  public async provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    try {
      // No-op if we're not in a Dendron Workspace
      if (!DendronExtension.isActive()) {
        return null;
      }

      // provide reference to header if selection is header.
      const header = getHeaderAt({ document, position });
      if (!_.isUndefined(header)) {
        const note = WSUtils.getNoteFromDocument(document);
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

      const refAtPos = getReferenceAtPosition(document, position);

      return refAtPos
        ? (await findReferences(refAtPos.ref)).map(({ location }) => location)
        : [];
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
}
