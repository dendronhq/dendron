import {
  MigrateFunction,
  Migrations,
  MigrationService,
  MigrationUtils,
  WorkspaceService,
} from "@dendronhq/engine-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe, test } from "mocha";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Logger } from "../../logger";
import { StartupUtils } from "../../utils/StartupUtils";
import { _activate } from "../../_extension";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

suite("MigrationService", function () {
  async function ranMigration(
    currentVersion: string,
    migrations: Migrations[]
  ) {
    const ws = ExtensionProvider.getDWorkspace();
    const { wsRoot } = ws;
    const config = await ws.config;
    const wsService = new WorkspaceService({ wsRoot });
    const out = await MigrationService.applyMigrationRules({
      currentVersion,
      previousVersion: "0.62.2",
      migrations,
      dendronConfig: config,
      wsService,
      wsConfig: await ExtensionProvider.getExtension().getWorkspaceSettings(),
      logger: Logger,
    });
    return out.length !== 0;
  }

  describeMultiWS(
    "GIVEN migration of semver 0.63.0",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      const dummyFunc: MigrateFunction = async ({
        dendronConfig,
        wsConfig,
      }) => {
        return { data: { dendronConfig, wsConfig } };
      };
      const migrations = [
        {
          version: "0.63.0",
          changes: [
            {
              name: "test",
              func: dummyFunc,
            },
          ],
        },
      ] as Migrations[];
      describe("WHEN current version is smaller than 0.63.0", () => {
        const currentVersion = "0.62.3";
        test("THEN migration should not run", async () => {
          const result = await ranMigration(currentVersion, migrations);
          expect(result).toBeFalsy();
        });
      });

      describe("WHEN current version is 0.63.0", () => {
        const currentVersion = "0.63.0";
        test("THEN migration should run", async () => {
          const result = await ranMigration(currentVersion, migrations);
          expect(result).toBeTruthy();
        });
      });

      describe("WHEN current version is larger than 0.63.0", () => {
        const currentVersion = "0.63.1";
        test("THEN migration should run", async () => {
          const result = await ranMigration(currentVersion, migrations);
          expect(result).toBeTruthy();
        });
      });
    }
  );
});

suite("MigrationUtils", () => {
  describe("deepCleanObjBy", () => {
    describe("GIVEN _.isNull as predicate", () => {
      describe("WHEN an object has kvp that has null value", () => {
        test("THEN all kvp that has null value are omitted from object", () => {
          const obj = { a: { b: null, c: "foo", d: null } };
          const expected = { a: { c: "foo" } };
          expect(MigrationUtils.deepCleanObjBy(obj, _.isNull)).toEqual(
            expected
          );
        });
      });

      describe("WHEN an object has no kvp that has null value", () => {
        test("THEN nothing is omitted", () => {
          const obj = { a: { b: "foo", c: "bar", d: "egg" } };
          expect(MigrationUtils.deepCleanObjBy(obj, _.isNull)).toEqual(obj);
        });
      });
    });
  });
});

suite("GIVEN upgrade", () => {
  describe("WHEN previous version was below 0.63.0", () => {
    test("THEN should show prompt", () => {
      const shouldShow = StartupUtils.shouldShowManualUpgradeMessage({
        previousWorkspaceVersion: "0.62.0",
        currentVersion: "0.102.0",
      });
      expect(shouldShow).toBeTruthy();
    });
  });
  describe("WHEN previous version was above 0.63.0", () => {
    test("THEN should not show prompt", () => {
      const shouldShow = StartupUtils.shouldShowManualUpgradeMessage({
        previousWorkspaceVersion: "0.100.0",
        currentVersion: "0.102.0",
      });
      expect(shouldShow).toBeFalsy();
    });
  });
});
