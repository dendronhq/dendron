import {
  InstallStatus,
  LegacyLookupSelectionType,
  WorkspaceType,
  ConfigUtils,
  LookupSelectionModeEnum,
  IntermediateDendronConfig,
  LegacyDuplicateNoteAction,
} from "@dendronhq/common-all";
import {
  ALL_MIGRATIONS,
  Migrations,
  MigrateFunction,
  MigrationService,
  WorkspaceService,
  DConfig,
  MigrationUtils,
  CONFIG_MIGRATIONS,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { describe, test } from "mocha";
import semver from "semver";
import sinon from "sinon";
import { CONFIG, GLOBAL_STATE, WORKSPACE_STATE } from "../../constants";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getExtension, getDWorkspace, DendronExtension } from "../../workspace";
import { _activate } from "../../_extension";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { ExtensionProvider } from "../../ExtensionProvider";
import { readYAML } from "@dendronhq/common-server";
import path from "path";
import fs from "fs-extra";

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
          const out = await MigrationService.applyMigrationRules({
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
          const dendronVersion =
            ConfigUtils.getWorkspace(newDendronConfig).dendronVersion;
          expect(dendronVersion).toEqual("0.46.0");
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
            delete config.workspace["journal"];
            return config;
          },
          onInit: async ({ engine, wsRoot }) => {
            const dendronConfig = engine.config;
            const wsConfig = await getExtension().getWorkspaceSettings();
            const wsService = new WorkspaceService({ wsRoot });
            const out = await MigrationService.applyMigrationRules({
              currentVersion: "0.47.1",
              previousVersion: "0.46.0",
              dendronConfig,
              wsConfig,
              wsService,
              logger: Logger,
              migrations: getMigration({ from: "0.46.0", to: "0.47.1" }),
            });
            expect(out.length).toEqual(1);
            const config = getDWorkspace().config;
            const journalConfig = ConfigUtils.getJournal(config);
            const defaultJournalConfig = ConfigUtils.getJournal(
              ConfigUtils.genDefaultConfig()
            );
            expect(journalConfig).toEqual(defaultJournalConfig);
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
            const out = await MigrationService.applyMigrationRules({
              currentVersion: "0.47.1",
              previousVersion: "0.46.0",
              dendronConfig,
              wsConfig,
              wsService,
              logger: Logger,
              migrations: getMigration({ from: "0.46.0", to: "0.47.1" }),
            });
            expect(out.length).toEqual(1);
            const config = getDWorkspace().config;
            const journalConfig = ConfigUtils.getJournal(config);
            const expectedJournalConfig = {
              ...ConfigUtils.getJournal(ConfigUtils.genDefaultConfig()),
              name: "foo",
            };
            expect(journalConfig).toEqual(expectedJournalConfig);
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
          await MigrationService.applyMigrationRules({
            currentVersion: "0.52.0",
            previousVersion: "0.51.0",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: getMigration({ from: "0.51.0", to: "0.52.0" }),
          });
          const config = getDWorkspace().config;
          const scratchConfig = ConfigUtils.getScratch(config);
          const expectedScratchConfig = {
            ...ConfigUtils.getScratch(ConfigUtils.genDefaultConfig()),
            name: "foo",
          };
          expect(scratchConfig).toEqual(expectedScratchConfig);
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

    test("migrate to 0.51.4 (set scratch notes in dendron.yml), non standard settings", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ engine, wsRoot }) => {
          const dendronConfig = engine.config;
          const wsConfig = await getExtension().getWorkspaceSettings();
          const wsService = new WorkspaceService({ wsRoot });
          await MigrationService.applyMigrationRules({
            currentVersion: "0.51.4",
            previousVersion: "0.51.3",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: getMigration({ from: "0.51.0", to: "0.51.4" }),
          });
          done();
        },
      });
    });

    test("migrate to 0.55.2 (old existing ws config to new dendron config)", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config) => {
          // @ts-ignore
          delete config.commands["lookup"];
          return config;
        },
        onInit: async ({ engine, wsRoot }) => {
          const dendronConfig = engine.config;
          const wsConfig = await getExtension().getWorkspaceSettings();
          const wsService = new WorkspaceService({ wsRoot });
          expect(
            wsConfig?.settings[CONFIG.DEFAULT_LOOKUP_CREATE_BEHAVIOR.key]
          ).toEqual(LegacyLookupSelectionType.selection2link);

          // // we explicitly deleted it. don't use ConfigUtils.
          const rawConfig = DConfig.getRaw(wsRoot);
          const lookup = rawConfig.commands?.lookup;
          expect(_.isUndefined(lookup)).toBeTruthy();
          await MigrationService.applyMigrationRules({
            currentVersion: "0.55.2",
            previousVersion: "0.55.1",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: getMigration({ from: "0.55.0", to: "0.55.2" }),
          });
          const config = getDWorkspace().config;
          const lookupConfig = ConfigUtils.getLookup(config);
          expect(lookupConfig.note.selectionMode).toEqual(
            LookupSelectionModeEnum.link
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
          delete config.commands["lookup"];
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

          // testing for explicitly deleted key.
          const rawConfig = DConfig.getRaw(wsRoot);
          const lookup = rawConfig.commands?.lookup;
          expect(_.isUndefined(lookup)).toBeTruthy();
          await MigrationService.applyMigrationRules({
            currentVersion: "0.55.2",
            previousVersion: "0.55.1",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: getMigration({ from: "0.55.0", to: "0.55.2" }),
          });
          const config = getDWorkspace().config;
          const lookupConfig = ConfigUtils.getLookup(config);
          expect(lookupConfig.note.selectionMode).toEqual(
            ConfigUtils.genDefaultConfig().commands!.lookup.note.selectionMode
          );
          done();
        },
        workspaceType: WorkspaceType.CODE,
      });
    });

    describeMultiWS(
      "GIVEN migration to 0.81.0 (publishing namespace migration)",
      {
        ctx,
        modConfigCb: (config) => {
          // add everything to site config.
          ConfigUtils.setProp(config, "useFMTitle", true);
          ConfigUtils.setProp(config, "hierarchyDisplay", true);
          ConfigUtils.setProp(config, "hierarchyDisplayTitle", "foo");
          ConfigUtils.setProp(config, "useNoteTitleForLink", true);
          ConfigUtils.setProp(config, "mermaid", true);
          ConfigUtils.setProp(config, "useKatex", true);
          ConfigUtils.setProp(config, "site", {
            usePrettyRefs: true,
            assetsPrefix: "bar",
            copyAssets: true,
            canonicalBaseUrl: "https://example.com",
            customHeaderPath: "header.html",
            ga_tracking: "true",
            logo: "vault/assets/images/logo.png",
            siteFaviconPath: "vault/assets/images/favicon.ico",
            siteIndex: "dendron",
            siteHierarchies: ["dendron", "lorem", "ipsum"],
            siteLastModified: true,
            siteRootDir: "docs",
            siteRepoDir: "https://github.com/dendronhq/dendron-site",
            siteUrl: "https://foo.dev.dendron.so",
            showFrontMatterTags: true,
            useHashesForFMTags: true,
            noRandomlyColoredTags: true,
            config: {
              dendron: {
                publishByDefault: true,
              },
              lorem: {
                publishByDefault: {
                  public: true,
                  private: false,
                },
              },
              ipsum: {
                publishByDefault: false,
              },
            },
            duplicateNoteBehavior: {
              action: LegacyDuplicateNoteAction.USE_VAULT,
              payload: ["vault", "vault2"],
            },
            writeStubs: true,
            title: "Dendron",
            description: "test desc",
            author: "dendronites",
            twitter: "dendronhq",
            image: {
              url: "https://example.com/images/image.png",
              alt: "alt for image",
            },
            githubCname: "foo.dev.dendron.so",
            gh_edit_link: "true",
            gh_edit_link_text: "Edit this page",
            gh_edit_repository:
              "https://github.com/dendronhq/dendron-test-repo",
            gh_edit_branch: "main",
            gh_edit_view_mode: "edit",
            useContainers: true,
            generateChangelog: true,
            segmentKey: "abcdefg",
            cognitoUserPoolId: "qwerty",
            cognitoClientId: "azerty",
            usePrettyLinks: true,
          });
          return config;
        },
      },
      () => {
        DendronExtension.version = () => "0.81.0";
        test("publishing config correctly migrates to new namespace", async () => {
          const engine = ExtensionProvider.getEngine();
          const wsRoot = ExtensionProvider.getDWorkspace().wsRoot;
          const dendronConfig = DConfig.getRaw(
            wsRoot
          ) as IntermediateDendronConfig;
          const wsConfig =
            await ExtensionProvider.getExtension().getWorkspaceSettings();
          const wsService = new WorkspaceService({ wsRoot });

          const oldKeys: string[] = [
            "site",
            "useFMTitle",
            "hierarchyDisplay",
            "hierarchyDisplayTitle",
            "useNoteTitleForLink",
            "mermaid",
            "site.usePrettyRefs",
            "useKatex",
            "site.assetsPrefix",
            "site.copyAssets",
            "site.canonicalBaseUrl",
            "site.customHeaderPath",
            "site.ga_tracking",
            "site.logo",
            "site.siteFaviconPath",
            "site.siteIndex",
            "site.siteHierarchies",
            "site.siteLastModified",
            "site.siteRootDir",
            "site.siteRepoDir",
            "site.siteUrl",
            "site.showFrontMatterTags",
            "site.useHashesForFMTags",
            "site.noRandomlyColoredTags",
            "site.config",
            "site.duplicateNoteBehavior",
            "site.writeStubs",
            "site.title",
            "site.description",
            "site.author",
            "site.twitter",
            "site.image",
            "site.githubCname",
            "site.gh_edit_link",
            "site.gh_edit_link_text",
            "site.gh_edit_branch",
            "site.gh_edit_repository",
            "site.useContainers",
            "site.generateChangelog",
            "site.segmentKey",
            "site.cognitoUserPoolId",
            "site.cognitoClientId",
            "site.usePrettyLinks",
          ];

          dendronConfig["version"] = 4;
          delete dendronConfig["publishing"];
          const originalDeepCopy = _.cloneDeep(dendronConfig);

          // all old configs should exist prior to migration
          const preMigrationCheckItems = [
            _.isUndefined(dendronConfig["publishing"]),
            oldKeys.every((value) => {
              return !_.isUndefined(_.get(dendronConfig, value));
            }),
          ];

          preMigrationCheckItems.forEach((item) => {
            expect(item).toBeTruthy();
          });

          await MigrationService.applyMigrationRules({
            currentVersion: "0.81.0",
            previousVersion: "0.81.0",
            dendronConfig,
            wsConfig,
            wsService,
            logger: Logger,
            migrations: [CONFIG_MIGRATIONS],
          });

          // backup of the original should exist.
          const allWSRootFiles = fs.readdirSync(wsRoot, {
            withFileTypes: true,
          });
          const maybeBackupFileName = allWSRootFiles
            .filter((ent) => ent.isFile())
            .filter((fileEnt) =>
              fileEnt.name.includes("migrate-config")
            )[0].name;
          expect(!_.isUndefined(maybeBackupFileName)).toBeTruthy();

          // backup content should be identical to original deep copy.
          const backupContent = readYAML(
            path.join(wsRoot, maybeBackupFileName)
          ) as IntermediateDendronConfig;

          // need to omit these because they are set by default during ws init.
          expect(
            _.isEqual(
              _.omit(backupContent, ["version", "publishing"]),
              _.omit(originalDeepCopy, ["version"])
            )
          ).toBeTruthy();

          // post migration, publishing namespace should exist
          const postMigrationDendronConfig = (await engine.getConfig()).data!;
          const postMigrationKeys = Object.keys(postMigrationDendronConfig);
          expect(postMigrationKeys.includes("publishing")).toBeTruthy();
          // and all old keys should not exist
          expect(
            oldKeys.every((value) => postMigrationKeys.includes(value))
          ).toBeFalsy();
        });
      }
    );
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
    const out = await MigrationService.applyMigrationRules({
      currentVersion,
      previousVersion: "0.62.2",
      migrations,
      dendronConfig: config,
      wsService,
      wsConfig: await getExtension().getWorkspaceSettings(),
      logger: Logger,
    });
    return out.length !== 0;
  }

  describeMultiWS(
    "GIVEN migration of semver 0.63.0",
    {
      ctx,
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
