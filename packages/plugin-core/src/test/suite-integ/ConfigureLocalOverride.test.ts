import { DConfig, LocalConfigScope } from "@dendronhq/common-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import { describe, beforeEach, afterEach } from "mocha";
import { ConfigureLocalOverride } from "../../commands/ConfigureLocalOverride";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { describeSingleWS } from "../testUtilsV3";
import { SinonStub } from "sinon";

suite("ConfigureLocalOverrideCommand", function () {
  let homeDirStub: SinonStub;

  describeSingleWS("WHEN run", {}, () => {
    let cmd: ConfigureLocalOverride;

    beforeEach(() => {
      const ext = ExtensionProvider.getExtension();
      cmd = new ConfigureLocalOverride(ext);
    });

    describe("AND scopoe is GLOBAL", () => {
      test("THEN the configuration file for the user should open", async () => {
        await cmd.run({ configScope: LocalConfigScope.GLOBAL });

        const { wsRoot } = ExtensionProvider.getDWorkspace();
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.toLowerCase()
        ).toEqual(
          DConfig.configOverridePath(
            wsRoot,
            LocalConfigScope.GLOBAL
          ).toLowerCase()
        );
      });
    });

    describe("AND scope is LOCAL", () => {
      beforeEach(() => {
        homeDirStub = TestEngineUtils.mockHomeDir();
      });
      afterEach(() => {
        homeDirStub.restore();
      });

      test("THEN the configuration file for the workspace should open", async () => {
        await cmd.run({ configScope: LocalConfigScope.WORKSPACE });

        const { wsRoot } = ExtensionProvider.getDWorkspace();
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.toLowerCase()
        ).toEqual(
          DConfig.configOverridePath(
            wsRoot,
            LocalConfigScope.WORKSPACE
          ).toLowerCase()
        );
      });
    });
  });
});
