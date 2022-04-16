import { PodExportScope } from "@dendronhq/pods-core";
import { describe } from "mocha";
import { JSONExportPodCommand } from "../../../../commands/pods/JSONExportPodCommand";
import { ExtensionProvider } from "../../../../ExtensionProvider";
import { expect } from "../../../testUtilsv2";
import { describeSingleWS } from "../../../testUtilsV3";

suite("JSONExportPodCommand", function () {
  describe("GIVEN a JSONExportPodCommand is ran with Vault scope", () => {
    describeSingleWS("WHEN the destination is clipboard", {}, () => {
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
    });
  });
});
