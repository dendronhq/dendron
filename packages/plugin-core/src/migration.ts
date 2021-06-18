import {
  DendronConfig,
  DendronError,
  WorkspaceOpts,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import {
  assignJSONWithComment,
  SegmentClient,
  TelemetryStatus,
  vault2Path,
  writeJSONWithComments,
} from "@dendronhq/common-server";
import {
  DConfig,
  removeCache,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import semver from "semver";
import { Logger } from "./logger";
import { DendronWorkspace } from "./workspace";

type MigrateFunction = (opts: {
  dendronConfig: DendronConfig;
  wsConfig: WorkspaceSettings;
  wsService: WorkspaceService;
}) => Promise<{
  error?: DendronError;
  data: { dendronConfig: DendronConfig; wsConfig: WorkspaceSettings };
}>;

type MigrationChangeSet = {
  name: string;
  func: MigrateFunction;
};

type Migrations = {
  version: string;
  changes: MigrationChangeSet[];
};

type MigrationChangeSetStatus = {
  error?: DendronError;
  data: {
    version: string;
    changeName: string;
    status: "ok" | "error";
    dendronConfig: DendronConfig;
    wsConfig: WorkspaceSettings;
  };
};

type ApplyMigrationRuleOpts = {
  currentVersion: string;
  previousVersion: string;
  dendronConfig: DendronConfig;
  wsConfig: WorkspaceSettings;
  wsService: WorkspaceService;
};
/**
 * Migrate state beweten updates
 */
export async function applyMigrationRules({
  currentVersion,
  previousVersion,
  ...rest
}: ApplyMigrationRuleOpts): Promise<MigrationChangeSetStatus[]> {
  const allMigrations: Migrations[] = [
    {
      version: "0.46.0",
      changes: [
        {
          name: "update cache",
          func: async ({ dendronConfig, wsConfig, wsService }) => {
            const ctx = "update cache migration";
            const { wsRoot, config } = wsService;
            await Promise.all(
              wsService.config.vaults.map((vault) => {
                return removeCache(vault2Path({ wsRoot, vault }));
              })
            );
            Logger.info({ ctx, msg: "done removing cache" });
            // update telemetry settings
            Logger.info({ ctx, msg: "keep existing analytics settings" });
            const segStatus = SegmentClient.getStatus();
            // use has not disabled telemetry prior to upgrade
            if (
              segStatus !== TelemetryStatus.DISABLED_BY_COMMAND &&
              !config.noTelemetry
            ) {
              SegmentClient.enable(TelemetryStatus.ENABLED_BY_MIGRATION);
            }
            return { data: { dendronConfig, wsConfig } };
          },
        },
      ],
    },
  ];
  // find relevant migraiton rules
  // _.reduce(rules, (prev, curr) => {
  // }, Promise.resolve({}))
  // // {
  //   name: "migrate journal config",
  //   version: "0.46.1",
  //   migrateFunc: ({dendronConfig, wsConfig}) => {
  //     dendronConfig.journal  = DConfig.genDefaultConfig().journal;
  //     return {dendronConfig, wsConfig}
  //   }
  // },

  // take all migrations that are greater than the previous version number
  const results: MigrationChangeSetStatus[][] = [];
  // run migrations from oldest to newest
  const migrationsToRun = _.reverse(
    _.takeWhile(allMigrations, (ent) => {
      return semver.lt(previousVersion, ent.version);
    })
  );
  await _.reduce(
    migrationsToRun,
    async (prev, migration) => {
      await prev;
      const out = await applyMigrationChanges({
        currentVersion,
        previousVersion,
        migration,
        ...rest,
      });
      results.push(out);
      return out;
    },
    Promise.resolve({})
  );
  return _.flatten(results);
}

async function applyMigrationChanges({
  currentVersion,
  previousVersion,
  migration,
  wsService,
  ...rest
}: {
  migration: Migrations;
} & ApplyMigrationRuleOpts) {
  const results: MigrationChangeSetStatus[] = [];
  await _.reduce(
    migration.changes,
    async (prev, change) => {
      const { data } = await prev;
      Logger.info({ ctx: "applyMigrationChange", name: change.name });
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

export async function migrateSettings({
  settings,
}: {
  settings: WorkspaceSettings;
  config: DendronConfig;
}) {
  let changed = false;
  const newFolders: WorkspaceSettings["folders"] = [];
  settings.folders.forEach((ent) => {
    if (path.isAbsolute(ent.path)) {
      const relPath = path.relative(DendronWorkspace.wsRoot(), ent.path);
      changed = true;
      newFolders.push({ ...ent, path: relPath });
    } else {
      newFolders.push(ent);
    }
  });
  if (changed) {
    settings = await assignJSONWithComment({ folders: newFolders }, settings);
  }
  writeJSONWithComments(DendronWorkspace.workspaceFile().fsPath, settings);
  return { changed, settings };
}

/**
 * Migrate dendron.yml if necessary
 */
export function migrateConfig({
  config,
  wsRoot,
}: { config: DendronConfig } & Omit<WorkspaceOpts, "vaults">) {
  const ctx = "migrateConfig";
  let changed = false;
  // if no config, write it in
  if (_.isEmpty(config.vaults)) {
    Logger.info({ ctx, msg: "config.vaults empty" });
    const wsFolders = DendronWorkspace.workspaceFolders();
    if (_.isUndefined(wsFolders)) {
      throw new DendronError({ message: "no vaults detected" });
    }
    const vault = {
      fsPath: path.relative(wsRoot, wsFolders[0].uri.fsPath),
    };
    config.vaults = [vault];
    changed = true;
  }
  // if no version, write it in
  if (_.isUndefined(config.version)) {
    config.version = 0;
    changed = true;
  }

  // check if vaults are absolute path, if so, change
  config.vaults.forEach((ent) => {
    if (path.isAbsolute(ent.fsPath)) {
      ent.fsPath = path.relative(wsRoot, ent.fsPath);
      changed = true;
    }
  });

  if (changed) {
    DConfig.writeConfig({ wsRoot, config });
  }
  return changed;
}
