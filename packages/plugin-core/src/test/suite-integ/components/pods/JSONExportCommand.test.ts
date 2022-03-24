import { PodExportScope } from "@dendronhq/pods-core";
import { describe } from "mocha";
import * as vscode from "vscode";
import { describeSingleWS, setupBeforeAfter } from "../../../testUtilsV3";
import { JSONExportPodCommand } from "../../../../commands/pods/JSONExportPodCommand";
import { expect } from "../../../testUtilsv2";
import { ExtensionProvider } from "../../../../ExtensionProvider";

suite("JSONExportPodCommand", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("GIVEN a JSONExportPodCommand is ran with Vault scope", () => {
    describeSingleWS(
      "WHEN the destination is clipboard",
      {
        ctx,
      },
      () => {
        test("THEN multi notes export error message must be displayed", async () => {
          const ext = ExtensionProvider.getExtension();
          const cmd = new JSONExportPodCommand(ext);
          await expect(async () =>
            cmd.gatherInputs({
              exportScope: PodExportScope.Vault,
              destination: "clipboard",
            })
          ).toThrow(
            "Multi Note Export cannot have clipboard as destination. Please configure your destination by using Dendron: Configure Export Pod V2 command"
          );
        });
      }
    );
  });
});
