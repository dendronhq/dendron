import path from "path";
import { ConfigureCommand } from "../../commands/ConfigureCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS, describeSingleWS } from "../testUtilsV3";
import { before } from "mocha";

suite("ConfigureCommand", function () {
  describeSingleWS("WHEN run", {}, () => {
    before(async () => {
      await new ConfigureCommand(ExtensionProvider.getExtension()).run();
    });

    test("THEN opens the configuration file", () => {
      const { wsRoot } = ExtensionProvider.getDWorkspace();
      expect(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.toLowerCase()
      ).toEqual(path.join(wsRoot, "dendron.yml").toLowerCase());
    });
  });

  describeMultiWS(
    "WHEN there are multiple config files inside the workspace",
    {
      // Self contained workspace with multiple vaults will have a config file in each vault
      selfContained: true,
    },
    () => {
      before(async () => {
        await new ConfigureCommand(ExtensionProvider.getExtension()).run();
      });

      test("THEN opens the configuration file", () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.toLowerCase()
        ).toEqual(path.join(wsRoot, "dendron.yml").toLowerCase());
      });
    }
  );
});
