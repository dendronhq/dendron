import {
  InstallStatus,
  LegacyLookupConfig,
  LegacyLookupSelectionType,
  LegacyRandomNoteConfig,
  LegacyInsertNoteLinkConfig,
  LegacyInsertNoteIndexConfig,
  WorkspaceType,
} from "@dendronhq/common-all";
import {
  ALL_MIGRATIONS,
  DConfig,
  Migrations,
  MigrateFunction,
  MigrationServce,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import fs from "fs-extra";
import path from "path";
import { describe, test } from "mocha";
import semver from "semver";
import sinon from "sinon";
import { CONFIG, GLOBAL_STATE, WORKSPACE_STATE } from "../../constants";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../utils";
import { getExtension, getDWorkspace, DendronExtension } from "../../workspace";
import { _activate } from "../../_extension";
import { expect } from "../testUtilsv2";
import { describeMultiWS, runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { readYAML } from "@dendronhq/common-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";

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
  const ctx = setupBeforeAfter(this);

  describe.skip("runMigration from activate", () => {
    test("global version ahead of workspace version", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async () => {
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
          const wsConfig = await getExtension().getWorkspaceSettings();
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

    describe("migrate to 47.1", () => {
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
            const wsConfig = await getExtension().getWorkspaceSettings();
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
            expect(getDWorkspace().config.journal).toEqual(
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
            const wsConfig = await getExtension().getWorkspaceSettings();
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
            expect(getDWorkspace().config.journal).toEqual({
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
          workspaceType: WorkspaceType.CODE,
        });
      });
    });

    test("migrate to 0.52.0, non standard settings", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ engine, wsRoot }) => {
          const dendronConfig = engine.config;
          const wsConfig = await getExtension().getWorkspaceSettings();
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
          expect(getDWorkspace().config.scratch).toEqual({
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
        workspaceType: WorkspaceType.CODE,
      });
    });

    test("migrate to 0.51.4 (set preview v2), previewv2 not set", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config) => {
          config.dev = { enablePreviewV2: false };
          return config;
        },
        onInit: async ({ engine, wsRoot }) => {
          const dendronConfig = engine.config;
          const wsConfig = await getExtension().getWorkspaceSettings();
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
          expect(getDWorkspace().config.dev?.enablePreviewV2).toBeFalsy();
          done();
        },
      });
    });

    test("migrate to 0.51.4 (set scratch notes in dendron.yml), non standard settings", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config) => {
          config.dev = { enablePreviewV2: true };
          return config;
        },
        onInit: async ({ engine, wsRoot }) => {
          const dendronConfig = engine.config;
          const wsConfig = await getExtension().getWorkspaceSettings();
          const wsService = new WorkspaceService({ wsRoot });
          await MigrationServce.applyMigrationRules({
            currentVersion: "0.51.4",
            previousVersion: "0.51.3",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: getMigration({ from: "0.51.0", to: "0.51.4" }),
          });
          expect(getDWorkspace().config.dev?.enablePreviewV2).toBeTruthy();
          done();
        },
      });
    });

    test("migrate to 0.55.2 (old existing ws config to new dendron config)", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config) => {
          // @ts-ignore
          delete config["lookup"];
          return config;
        },
        onInit: async ({ engine, wsRoot }) => {
          const dendronConfig = engine.config;
          const wsConfig = await getExtension().getWorkspaceSettings();
          const wsService = new WorkspaceService({ wsRoot });
          expect(
            wsConfig?.settings[CONFIG.DEFAULT_LOOKUP_CREATE_BEHAVIOR.key]
          ).toEqual(LegacyLookupSelectionType.selection2link);
          expect(_.isUndefined(dendronConfig.lookup)).toBeTruthy();
          await MigrationServce.applyMigrationRules({
            currentVersion: "0.55.2",
            previousVersion: "0.55.1",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: getMigration({ from: "0.55.0", to: "0.55.2" }),
          });
          expect(getDWorkspace().config.lookup!.note.selectionType).toEqual(
            LegacyLookupSelectionType.selection2link
          );
          done();
        },
        wsSettingsOverride: {
          settings: {
            [CONFIG.DEFAULT_LOOKUP_CREATE_BEHAVIOR.key]:
              LegacyLookupSelectionType.selection2link,
          },
        },
        workspaceType: WorkspaceType.CODE,
      });
    });

    test("migrate to 0.55.2 (implicit to new dendron config)", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config) => {
          // @ts-ignore
          delete config["lookup"];
          return config;
        },
        onInit: async ({ engine, wsRoot }) => {
          const dendronConfig = engine.config;
          const wsConfig = await getExtension().getWorkspaceSettings();
          const wsService = new WorkspaceService({ wsRoot });
          expect(
            _.isUndefined(
              wsConfig?.settings[CONFIG.DEFAULT_LOOKUP_CREATE_BEHAVIOR.key]
            )
          ).toBeTruthy();
          expect(_.isUndefined(dendronConfig.lookup)).toBeTruthy();
          await MigrationServce.applyMigrationRules({
            currentVersion: "0.55.2",
            previousVersion: "0.55.1",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: getMigration({ from: "0.55.0", to: "0.55.2" }),
          });
          expect(getDWorkspace().config.lookup!.note.selectionType).toEqual(
            DConfig.genDefaultConfig().lookup!.note.selectionType
          );
          done();
        },
        workspaceType: WorkspaceType.CODE,
      });
    });

    test("migrate to 0.63 (dendron config command namespace)", (done) => {
      DendronExtension.version = () => "0.0.1";
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config) => {
          config["randomNote"] = {
            include: ["foo", "bar"],
            exclude: ["lorem"]
          } as LegacyRandomNoteConfig;
          config["defaultInsertHierarchy"] = "user.foo";
          config["insertNoteLink"] = {
            aliasMode: "none",
            multiSelect: true,
          } as LegacyInsertNoteLinkConfig;
          config["insertNoteIndex"] = {
            marker: true,
          } as LegacyInsertNoteIndexConfig;
          config["lookup"] = {
            note: {
              selectionType: "none",
              leaveTrace: true,
            }
          } as LegacyLookupConfig;
          config["lookupConfirmVaultOnCreate"] = false;

          // @ts-ignore
          delete config["commands"];
          return config;
        },
        onInit: async ({ engine, wsRoot }) => {
          const dendronConfig = engine.config;
          const originalDeepCopy = _.cloneDeep(dendronConfig);
          const wsConfig = await getExtension().getWorkspaceSettings();
          const wsService = new WorkspaceService({ wsRoot });

          // all command related old configs should exist prior to migration
          const preMigrationCheckItems = [
            _.isUndefined(dendronConfig["commands"]),
            !_.isUndefined(dendronConfig["randomNote"]),
            !_.isUndefined(dendronConfig["defaultInsertHierarchy"]),
            !_.isUndefined(dendronConfig["insertNoteLink"]),
            !_.isUndefined(dendronConfig["insertNoteIndex"]),
            !_.isUndefined(dendronConfig["lookup"]),
            !_.isUndefined(dendronConfig["lookupConfirmVaultOnCreate"])
          ];

          const oldKeys = [
            "randomNote",
            "defaultInsertHierarchy",
            "insertNoteLink",
            "insertNoteIndex",
            "lookup",
            "lookupConfirmVaultOnCreate"
          ];
          const preMigrationKeys = Object.keys(dendronConfig);
          expect(oldKeys.every((value) => preMigrationKeys.includes(value))).toBeTruthy();


          preMigrationCheckItems.forEach((item) => {
            expect(item).toBeTruthy();
          });

          await MigrationServce.applyMigrationRules({
            currentVersion: "0.63.0",
            previousVersion: "0.62.0",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: getMigration({ from: "0.62.0", to: "0.63.0" }),
          });

          // backup of the original should exist.
          const allWSRootFiles = fs.readdirSync(wsRoot, { withFileTypes: true});
          const maybeBackupFileName = allWSRootFiles.filter(
            (ent) => ent.isFile()
          ).filter(
            (fileEnt) => fileEnt.name.includes("migrate-command-config")
          )[0].name;
          expect(!_.isUndefined(maybeBackupFileName)).toBeTruthy();
          
          const backupContent = readYAML(path.join(wsRoot, maybeBackupFileName));
          expect(_.isEqual(backupContent, originalDeepCopy)).toBeTruthy();

          // all command related old configs shouldn't exist after migration
          // they should all be in the command namespace instead.
          const postMigrationDendronConfig = (await engine.getConfig()).data!;
          const postMigrationKeys = Object.keys(postMigrationDendronConfig);
          expect(postMigrationKeys.includes("commands")).toBeTruthy();
          expect(oldKeys.every((value) => postMigrationKeys.includes(value))).toBeFalsy();
          
          done();
        }
      })
    })
  });
});

suite("MigrationService", function () {
  const ctx = setupBeforeAfter(this);

  async function ranMigration(
    currentVersion: string,
    migrations: Migrations[]
  ) {
    const { wsRoot, config } = getDWorkspace();
    const wsService = new WorkspaceService({ wsRoot });
    const out = await MigrationServce.applyMigrationRules({
      currentVersion,
      previousVersion: "0.62.2",
      migrations,
      dendronConfig: config,
      wsService,
      wsConfig: await getExtension().getWorkspaceSettings(),
      logger: Logger
    });
    return out.length !== 0;
  }

  describeMultiWS(
    "GIVEN migration of semver 0.63.0", 
    {
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    async () => {
      const dummyFunc: MigrateFunction = async ({dendronConfig, wsConfig}) => {
        return { data: { dendronConfig, wsConfig } }
      };
      const migrations = [
        {
          version: "0.63.0",
          changes: [
            {
              name: "test",
              func: dummyFunc,
            }
          ]
        }
      ] as Migrations[];
      describe("WHEN current version is smaller than 0.63.0", () => {
        const currentVersion = "0.62.3"
        test("THEN migration should not run", async () => {
          const result = await ranMigration(
            currentVersion,
            migrations,
          )
          expect(result).toBeFalsy()
        })
      })

      describe("WHEN current version is 0.63.0", () => {
        const currentVersion = "0.63.0"
        test("THEN migration should run", async () => {
          const result = await ranMigration(
            currentVersion,
            migrations,
          )
          expect(result).toBeTruthy();
        })
      })

      describe("WHEN current version is larger than 0.63.0", () => {
        const currentVersion = "0.63.1"
        test("THEN migration should run", async () => {
          const result = await ranMigration(
            currentVersion,
            migrations,
          ) 
          expect(result).toBeTruthy();
        })
      })
    }
  )
});