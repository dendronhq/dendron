import vscode from "vscode";
import { findReferences, getReferenceAtPosition } from "../utils/md";

export default class ReferenceProvider implements vscode.ReferenceProvider {
  public async provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    const refAtPos = getReferenceAtPosition(document, position);

    return refAtPos
      ? (await findReferences(refAtPos.ref)).map(({ location }) => location)
      : [];
  }
}
