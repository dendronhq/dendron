import {
  IntermediateDendronConfig,
  getStage,
  InstallStatus,
  WorkspaceSettings,
  ConfigUtils,
} from "@dendronhq/common-all";
import { createDisposableLogger, DLogger } from "@dendronhq/common-server";
import _ from "lodash";
import semver from "semver";
import { WorkspaceService } from "../workspace";
import { ALL_MIGRATIONS } from "./migrations";
import { MigrationChangeSetStatus, Migrations } from "./types";

type ApplyMigrationRuleOpts = {
  currentVersion: string;
  previousVersion: string;
  dendronConfig: IntermediateDendronConfig;
  wsConfig?: WorkspaceSettings;
  wsService: WorkspaceService;
  migrations?: Migrations[];
  runAll?: boolean;
  logger: DLogger;
};

export class MigrationServce {
  static async applyMigrationRules({
    currentVersion,
    previousVersion,
    migrations,
    wsService,
    ...rest
  }: ApplyMigrationRuleOpts): Promise<MigrationChangeSetStatus[]> {
    const results: MigrationChangeSetStatus[][] = [];
    // run migrations from oldest to newest
    const migrationsToRun = _.reverse(
      _.takeWhile(migrations || ALL_MIGRATIONS, (ent) => {
        const out =
          semver.lte(previousVersion, ent.version) &&
          semver.gte(currentVersion, ent.version);
        return out;
      })
    );
    const { logger, dispose } = createDisposableLogger("migration");
    logger.info({
      migrations: migrationsToRun.map((m) => [
        m.version,
        m.changes.map((c) => c.name),
      ]),
    });
    dispose();
    await _.reduce(
      migrationsToRun,
      async (prev, migration) => {
        await prev;
        const out = await this.applyMigrationChanges({
          currentVersion,
          previousVersion,
          migration,
          wsService,
          ...rest,
        });
        results.push(out);
        return out;
      },
      Promise.resolve({})
    );
    const changes = _.flatten(results);
    if (!_.isEmpty(changes)) {
      const { data } = _.last(changes)!;
      ConfigUtils.setWorkspaceProp(
        data.dendronConfig,
        "dendronVersion",
        currentVersion
      );
      wsService.setConfig(data.dendronConfig);
      // wsConfig is undefined for native workspaces
      if (data.wsConfig) wsService.setWorkspaceConfig(data.wsConfig);
    }
    return changes;
  }

  static async applyMigrationChanges({
    previousVersion,
    migration,
    wsService,
    logger,
    ...rest
  }: {
    migration: Migrations;
  } & ApplyMigrationRuleOpts) {
    const results: MigrationChangeSetStatus[] = [];
    await _.reduce(
      migration.changes,
      async (prev, change) => {
        const { data } = await prev;
        logger.info({ ctx: "applyMigrationChange", name: change.name });
        const { dendronConfig, wsConfig } = data;
        const out = await change.func({ dendronConfig, wsConfig, wsService });
        const changeStatus: MigrationChangeSetStatus = {
          data: {
            changeName: change.name,
            status: "ok",
            version: migration.version,
            ...out.data,
          },
        };
        results.push(changeStatus);
        return changeStatus;
      },
      Promise.resolve({
        data: {
          changeName: "no-op",
          version: "",
          status: "ok",
          ...rest,
        },
      } as MigrationChangeSetStatus)
    );
    return results;
  }

  /**
   * Should we attempt to migrate workspace settings
   * @returns
   */
  static shouldRunMigration({
    force,
    workspaceInstallStatus,
  }: {
    force?: boolean;
    workspaceInstallStatus: InstallStatus;
  }) {
    return (
      (workspaceInstallStatus === InstallStatus.UPGRADED || force) &&
      getStage() === "prod"
    );
  }
}
