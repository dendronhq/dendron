import semver from "semver";
import {
  ALL_MIGRATIONS,
  DConfig,
  Migrations,
  MigrationServce,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { it } from "mocha";
import sinon from "sinon";
import { ExtensionContext } from "vscode";
import { Logger } from "../../logger";
import { getWS } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { CONFIG } from "../../constants";

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
    if (from) {
      migrations = _.takeWhile(migrations, (mig) => {
        return semver.lt(from, mig.version);
      });
    }
    if (to) {
      migrations = _.dropWhile(migrations, (mig) => {
        return semver.gt(to, mig.version);
      });
    }
    return migrations;
  }
};

suite("Migration", function () {
  let ctx: ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: async () => {},
    afterHook: async () => {
      sinon.restore();
    },
  });

  it("migrate to 46.0", (done) => {
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
        expect(out[0].data.changeName).toEqual("update cache");
        expect(out.length).toEqual(1);
        done();
      },
    });
  });

  it("migrate to 46.1, default settings", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ engine, wsRoot }) => {
        const dendronConfig = engine.config;
        const wsConfig = await getWS().getWorkspaceSettings();
        const wsService = new WorkspaceService({ wsRoot });
        const out = await MigrationServce.applyMigrationRules({
          currentVersion: "0.46.1",
          previousVersion: "0.45.0",
          dendronConfig,
          wsConfig,
          wsService,
          logger: Logger,
          migrations: getMigration({ from: "0.45.0", to: "0.46.1" }),
        });
        expect(out.length).toEqual(2);
        expect(getWS().config.journal).toEqual(
          DConfig.genDefaultConfig().journal
        );
        done();
      },
    });
  });

  it("migrate to 46.1, non standard settings", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ engine, wsRoot }) => {
        const dendronConfig = engine.config;
        const wsConfig = await getWS().getWorkspaceSettings();
        const wsService = new WorkspaceService({ wsRoot });
        const out = await MigrationServce.applyMigrationRules({
          currentVersion: "0.46.1",
          previousVersion: "0.45.0",
          dendronConfig,
          wsConfig,
          wsService,
          logger: Logger,
          migrations: getMigration({ from: "0.45.0", to: "0.46.1" }),
        });
        expect(out.length).toEqual(2);
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
