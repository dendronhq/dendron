import * as vscode from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";

export class TraitUtils {
  /**
   * Shows a warning to user's about needing to enable workspace trust for traits.
   * @returns true if the workspace is trusted.
   */
  static checkWorkspaceTrustAndWarn(): boolean {
    const engine = ExtensionProvider.getEngine();

    const moreInfoBtn = "More Info";

    if (!engine.trustedWorkspace) {
      vscode.window
        .showErrorMessage(
          "Workspace Trust has been disabled for this workspace. Turn on workspace trust before using note traits.",
          moreInfoBtn
        )
        .then((resp) => {
          if (resp === moreInfoBtn) {
            vscode.commands.executeCommand(
              "vscode.open",
              "https://code.visualstudio.com/docs/editor/workspace-trust"
            );
          }
        });
    }

    return engine.trustedWorkspace;
  }
}
