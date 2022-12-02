import {
  DendronError,
  ConfigUtils,
  ConfigService,
  URI,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Migrations } from "./types";
import { MigrationUtils, PATH_MAP } from "./utils";
import { DEPRECATED_PATHS } from ".";
import { DConfig } from "@dendronhq/common-server";

export const CONFIG_MIGRATIONS: Migrations = {
  version: "0.83.0",
  changes: [
    {
      /**
       * This is the migration that was done to clean up all legacy config namespaces.
       */
      name: "migrate config",
      func: async ({ dendronConfig, wsConfig, wsService }) => {
        try {
          await DConfig.createBackup(wsService.wsRoot, "migrate-configs");
        } catch (error) {
          return {
            data: {
              dendronConfig,
              wsConfig,
            },
            error: new DendronError({
              message:
                "Backup failed during config migration. Exiting without migration.",
            }),
          };
        }

        const defaultV5Config = ConfigUtils.genDefaultConfig();
        const configReadRawResult = await ConfigService.instance().readRaw(
          URI.file(wsService.wsRoot)
        );
        if (configReadRawResult.isErr()) {
          throw configReadRawResult.error;
        }
        const rawDendronConfig = configReadRawResult.value;

        // remove all null properties
        const cleanDendronConfig = MigrationUtils.deepCleanObjBy(
          rawDendronConfig,
          _.isNull
        );

        if (_.isUndefined(cleanDendronConfig.commands)) {
          cleanDendronConfig.commands = {};
        }

        if (_.isUndefined(cleanDendronConfig.workspace)) {
          cleanDendronConfig.workspace = {};
        }

        if (_.isUndefined(cleanDendronConfig.preview)) {
          cleanDendronConfig.preview = {};
        }

        if (_.isUndefined(cleanDendronConfig.publishing)) {
          cleanDendronConfig.publishing = {};
        }

        // legacy paths to remove from config;
        const legacyPaths: string[] = [];
        // migrate each path mapped in current config version
        PATH_MAP.forEach((value, key) => {
          const { target: legacyPath, preserve } = value;
          let iteratee = value.iteratee;
          let valueToFill;
          let alreadyFilled;

          if (iteratee !== "skip") {
            alreadyFilled = _.has(cleanDendronConfig, key);
            const maybeLegacyConfig = _.get(cleanDendronConfig, legacyPath);
            if (_.isUndefined(maybeLegacyConfig)) {
              // legacy property doesn't have a value.
              valueToFill = _.get(defaultV5Config, key);
            } else {
              // there is a legacy value.
              // check if this mapping needs special treatment.
              if (_.isUndefined(iteratee)) {
                // assume identity mapping.
                iteratee = _.identity;
              }
              valueToFill = iteratee(maybeLegacyConfig);
            }
          }

          if (!alreadyFilled && !_.isUndefined(valueToFill)) {
            // if the property isn't already filled, fill it with determined value.
            _.set(cleanDendronConfig, key, valueToFill);
          }

          // these will later be used to delete.
          // only push if we aren't preserving target.
          if (!preserve) {
            legacyPaths.push(legacyPath);
          }
        });

        // set config version.
        _.set(cleanDendronConfig, "version", 5);

        // add deprecated paths to legacyPaths
        // so they could be unset if they exist
        legacyPaths.push(...DEPRECATED_PATHS);

        // remove legacy property from config after migration.
        legacyPaths.forEach((legacyPath) => {
          _.unset(cleanDendronConfig, legacyPath);
        });

        // recursively populate missing defaults
        const migratedConfig = _.defaultsDeep(
          cleanDendronConfig,
          defaultV5Config
        );

        return { data: { dendronConfig: migratedConfig, wsConfig } };
      },
    },
  ],
};

export const MIGRATION_ENTRIES = [CONFIG_MIGRATIONS];
