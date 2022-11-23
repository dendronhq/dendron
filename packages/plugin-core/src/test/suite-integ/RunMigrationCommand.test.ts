import _ from "lodash";
import {
  ConfigService,
  ConfigUtils,
  DendronConfig,
  URI,
  WorkspaceType,
} from "@dendronhq/common-all";
import sinon from "sinon";
import { RunMigrationCommand } from "../../commands/RunMigrationCommand";
import { expect } from "../testUtilsv2";
import { describeMultiWS, runTestButSkipForWindows } from "../testUtilsV3";
import { ExtensionProvider } from "../../ExtensionProvider";

suite("RunMigrationCommand", function () {
  describeMultiWS(
    "GIVEN Code workspace",
    {
      modConfigCb: (config) => {
        _.unset(config.commands, "lookup");
        return config;
      },
      workspaceType: WorkspaceType.CODE,
    },
    () => {
      test("THEN migration runs as expected", async () => {
        const ext = ExtensionProvider.getExtension();
        const cmd = new RunMigrationCommand(ext);
        expect(ext.type).toEqual(WorkspaceType.CODE);

        // testing for explicitly delete key.
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const rawConfig = (
          await ConfigService.instance().readRaw(URI.file(wsRoot))
        )._unsafeUnwrap() as DendronConfig;
        expect(_.isUndefined(rawConfig.commands?.lookup)).toBeTruthy();

        sinon.stub(cmd, "gatherInputs").resolves({ version: "0.83.0" });
        const out = await cmd.run();
        expect(out!.length).toEqual(1);
        expect(out![0].data.version === "0.83.0");

        expect(out![0].data.wsConfig).toNotEqual(undefined);

        const config = await ext.getDWorkspace().config;
        const lookupConfig = ConfigUtils.getLookup(config);
        expect(lookupConfig.note.selectionMode).toEqual("extract");
      });
    }
  );

  runTestButSkipForWindows()("", () => {
    describeMultiWS(
      "GIVEN Native workspace",
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
          expect(ext.type).toEqual(WorkspaceType.NATIVE);
          // testing for explicitly delete key.
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const rawConfig = (
            await ConfigService.instance().readRaw(URI.file(wsRoot))
          )._unsafeUnwrap() as DendronConfig;
          expect(_.isUndefined(rawConfig.commands?.lookup)).toBeTruthy();

          sinon.stub(cmd, "gatherInputs").resolves({ version: "0.83.0" });
          const out = await cmd.run();
          expect(out!.length).toEqual(1);
          expect(out![0].data.version === "0.83.0");

          // test if no wsConfig was passed to migration
          expect(out![0].data.wsConfig).toEqual(undefined);

          // test for existence of default key in the place where it was deleted.
          const config = await ext.getDWorkspace().config;
          const lookupConfig = ConfigUtils.getLookup(config);
          expect(lookupConfig.note.selectionMode).toEqual("extract");
        });
      }
    );
  });
});
