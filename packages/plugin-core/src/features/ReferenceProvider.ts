import vscode from "vscode";
import { findReferences, getReferenceAtPosition } from "../utils/md";
import * as Sentry from "@sentry/node";
import { DendronExtension } from "../workspace";

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
