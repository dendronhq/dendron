import _ from "lodash";
import {
  ConfigUtils,
  IntermediateDendronConfig,
  WorkspaceType,
} from "@dendronhq/common-all";
import sinon from "sinon";
import { RunMigrationCommand } from "../../commands/RunMigrationCommand";
import { CONFIG } from "../../constants";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";
import { DConfig } from "@dendronhq/engine-server";
import { ExtensionProvider } from "../../ExtensionProvider";

suite("RunMigrationCommand", function () {
  describeMultiWS(
    "GIVEN Code workspace",
    {
      modConfigCb: (config) => {
        _.unset(config.commands, "lookup");
        return config;
      },
      wsSettingsOverride: {
        settings: {
          [CONFIG.DEFAULT_LOOKUP_CREATE_BEHAVIOR.key]: "selection2link",
        },
      },
      workspaceType: WorkspaceType.CODE,
    },
    () => {
      test("THEN migration runs as expected", async () => {
        const ext = ExtensionProvider.getExtension();
        const cmd = new RunMigrationCommand(ext);

        // testing for explicitly delete key.
        const { wsRoot } = ext.getDWorkspace();
        const rawConfig = DConfig.getRaw(wsRoot) as IntermediateDendronConfig;
        expect(_.isUndefined(rawConfig.commands?.lookup)).toBeTruthy();

        sinon.stub(cmd, "gatherInputs").resolves({ version: "0.55.2" });
        const out = await cmd.run();
        expect(out!.length).toEqual(1);
        expect(out![0].data.version === "0.55.2");

        const config = ext.getDWorkspace().config;
        const lookupConfig = ConfigUtils.getLookup(config);
        expect(lookupConfig.note.selectionMode).toEqual("link");
      });
    }
  );

  describeMultiWS(
    "GIVEN Code workspace",
    {
      modConfigCb: (config) => {
        _.unset(config.commands, "lookup");
        return config;
      },
      workspaceType: WorkspaceType.NATIVE,
    },
    () => {
      test("THEN migration runs as expected without looking for workspace config.", async () => {
        const ext = ExtensionProvider.getExtension();
        const cmd = new RunMigrationCommand(ext);

        // testing for explicitly delete key.
        const { wsRoot } = ext.getDWorkspace();
        const rawConfig = DConfig.getRaw(wsRoot) as IntermediateDendronConfig;
        expect(_.isUndefined(rawConfig.commands?.lookup)).toBeTruthy();

        sinon.stub(cmd, "gatherInputs").resolves({ version: "0.83.0" });
        const out = await cmd.run();
        expect(out!.length).toEqual(1);
        expect(out![0].data.version === "0.83.0");

        // test if no wsConfig was passed to migration
        expect(out![0].data.wsConfig).toEqual(undefined);

        // test for existence of default key in the place where it was deleted.
        const config = ext.getDWorkspace().config;
        const lookupConfig = ConfigUtils.getLookup(config);
        expect(lookupConfig.note.selectionMode).toEqual("extract");
      });
    }
  );
});
