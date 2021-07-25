import {
  ALL_MIGRATIONS,
  DConfig,
  Migrations,
  MigrationServce,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { describe, test } from "mocha";
import semver from "semver";
import sinon from "sinon";
import { ExtensionContext } from "vscode";
import { CONFIG, GLOBAL_STATE, WORKSPACE_STATE } from "../../constants";
import { Logger } from "../../logger";
import { InstallStatus, VSCodeUtils } from "../../utils";
import { getWS } from "../../workspace";
import { _activate } from "../../_extension";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

const getMigration = ({
  exact,
  from,
  to,
}: Partial<{ from: string; exact: string; to: string }>): Migrations[] => {
  if (exact) {
    const maybeMigration = ALL_MIGRATIONS.find((ent) => ent.version === exact);
    if (_.isUndefined(maybeMigration)) {
      throw Error("no migration found");
    }
    return [maybeMigration];
  } else {
    let migrations = ALL_MIGRATIONS;
    // eg. take all migrations greater than the `from`
    if (from) {
      migrations = _.takeWhile(migrations, (mig) => {
        return semver.lt(from, mig.version);
      });
    }
    if (to) {
      migrations = _.dropWhile(migrations, (mig) => {
        return semver.gt(mig.version, to);
      });
    }
    return migrations;
  }
};

suite("Migration", function () {
  let ctx: ExtensionContext;
  ctx = setupBeforeAfter(this);

  describe.skip("runMigration from activate", () => {
    test("global version ahead of workspace version", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({}) => {
          await ctx.globalState.update(GLOBAL_STATE.VERSION, "0.46.0");
          await ctx.workspaceState.update(WORKSPACE_STATE.VERSION, "0.45.0");
          await _activate(ctx);
          expect(
            sinon
              .spy(VSCodeUtils, "getInstallStatusForExtension")
              .returned(InstallStatus.UPGRADED)
          );
          done();
        },
        modConfigCb: (config) => {
          // @ts-ignore
          delete config["journal"];
          return config;
        },
      });
    });
  });

  describe("runMigration only", () => {
    test("migrate to 46.0", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ engine, wsRoot }) => {
          const dendronConfig = engine.config;
          const wsConfig = await getWS().getWorkspaceSettings();
          const wsService = new WorkspaceService({ wsRoot });
          const out = await MigrationServce.applyMigrationRules({
            currentVersion: "0.46.0",
            previousVersion: "0.45.0",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: getMigration({ exact: "0.46.0" }),
          });
          const { dendronConfig: newDendronConfig, changeName } = out[0].data;
          expect(changeName).toEqual("update cache");
          expect(newDendronConfig.dendronVersion).toEqual("0.46.0");
          expect(out.length).toEqual(1);
          done();
        },
      });
    });

    describe("migrate to 47.1", function() {
      test("apply journal config, default settings", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          modConfigCb: (config) => {
            // we are deleting a field that was optional before migraiton, hence the ignore
            // @ts-ignore
            delete config["journal"];
            return config;
          },
          onInit: async ({ engine, wsRoot }) => {
            const dendronConfig = engine.config;
            const wsConfig = await getWS().getWorkspaceSettings();
            const wsService = new WorkspaceService({ wsRoot });
            const out = await MigrationServce.applyMigrationRules({
              currentVersion: "0.47.1",
              previousVersion: "0.46.0",
              dendronConfig,
              wsConfig,
              wsService,
              logger: Logger,
              migrations: getMigration({ from: "0.46.0", to: "0.47.1" }),
            });
            expect(out.length).toEqual(1);
            expect(getWS().config.journal).toEqual(
              DConfig.genDefaultConfig().journal
            );
            done();
          },
        });
      });

      test("apply journal config, non standard settings", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          modConfigCb: (config) => {
            // we are deleting a field that was optional before migraiton, hence the ignore
            // @ts-ignore
            delete config["journal"];
            return config;
          },
          onInit: async ({ engine, wsRoot }) => {
            const dendronConfig = engine.config;
            const wsConfig = await getWS().getWorkspaceSettings();
            const wsService = new WorkspaceService({ wsRoot });
            const out = await MigrationServce.applyMigrationRules({
              currentVersion: "0.47.1",
              previousVersion: "0.46.0",
              dendronConfig,
              wsConfig,
              wsService,
              logger: Logger,
              migrations: getMigration({ from: "0.46.0", to: "0.47.1" }),
            });
            expect(out.length).toEqual(1);
            expect(getWS().config.journal).toEqual({
              ...DConfig.genDefaultConfig().journal,
              name: "foo",
            });
            done();
          },
          wsSettingsOverride: {
            settings: {
              [CONFIG.DEFAULT_JOURNAL_NAME.key]: "foo",
            },
          },
        });
      });
    });

    test("migrate to 0.52.0, non standard settings", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ engine, wsRoot }) => {
          const dendronConfig = engine.config;
          const wsConfig = await getWS().getWorkspaceSettings();
          const wsService = new WorkspaceService({ wsRoot });
          await MigrationServce.applyMigrationRules({
            currentVersion: "0.52.0",
            previousVersion: "0.51.0",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: getMigration({ from: "0.51.0", to: "0.52.0" }),
          });
          expect(getWS().config.scratch).toEqual({
            ...DConfig.genDefaultConfig().scratch,
            name: "foo",
          });
          done();
        },
        wsSettingsOverride: {
          settings: {
            [CONFIG.DEFAULT_SCRATCH_NAME.key]: "foo",
          },
        },
      });
    });

    test("migrate to 0.51.4 (set preview v2), previewv2 note set", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config) => {
          config.dev = { enablePreviewV2: false };
          return config;
        },
        onInit: async ({ engine, wsRoot }) => {
          const dendronConfig = engine.config;
          const wsConfig = await getWS().getWorkspaceSettings();
          const wsService = new WorkspaceService({ wsRoot });
          await MigrationServce.applyMigrationRules({
            currentVersion: "0.52.0",
            previousVersion: "0.51.3",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: getMigration({ from: "0.51.0", to: "0.52.0" }),
          });
          expect(getWS().config.dev?.enablePreviewV2).toBeFalsy();
          done();
        },
      });
    });

    test("migrate to 0.51.4 (set preview v2), previewv2 set", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config) => {
          config.dev = { enablePreviewV2: true };
          return config;
        },
        onInit: async ({ engine, wsRoot }) => {
          const dendronConfig = engine.config;
          const wsConfig = await getWS().getWorkspaceSettings();
          const wsService = new WorkspaceService({ wsRoot });
          await MigrationServce.applyMigrationRules({
            currentVersion: "0.52.0",
            previousVersion: "0.51.3",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: getMigration({ from: "0.51.0", to: "0.52.0" }),
          });
          expect(getWS().config.dev?.enablePreviewV2).toBeTruthy();
          done();
        },
      });
    });
  });
});
