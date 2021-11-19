import {
  LegacyLookupSelectionType,
  LookupSelectionModeEnum,
  DendronError,
  ConfigUtils,
} from "@dendronhq/common-all";
import {
  SegmentClient,
  TelemetryStatus,
  vault2Path,
} from "@dendronhq/common-server";
import _ from "lodash";
import fs from "fs-extra";
import { DConfig } from "../config";
import { removeCache } from "../utils";
import { Migrations } from "./types";
import { MigrationUtils, PATH_MAP } from "./utils";
import { DEPRECATED_PATHS } from ".";

export const CONFIG_MIGRATIONS: Migrations = {
  version: "0.69.1",
  changes: [
    {
      name: "migrate config",
      func: async ({ dendronConfig, wsConfig, wsService }) => {
        /**
         * This migrates both commands and workspace namespace, if legacy property exists.
         * Doesn't overwrite existing properties.
         */

        const backupPath = DConfig.createBackup(
          wsService.wsRoot,
          "migrate-configs"
        );
        if (!fs.existsSync(backupPath)) {
          return {
            error: new DendronError({
              message:
                "Backup failed during config migration. Exiting without migration.",
            }),
            data: {
              dendronConfig,
              wsConfig,
            },
          };
        }

        const defaultV4Config = ConfigUtils.genDefaultConfig();
        const rawDendronConfig = DConfig.getRaw(wsService.wsRoot);

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
              valueToFill = _.get(defaultV4Config, key);
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
        _.set(cleanDendronConfig, "version", 4);

        // add deprecated paths to legacyPaths
        // so they could be unset if they exist
        legacyPaths.concat(DEPRECATED_PATHS);

        // remove legacy property from config after migration.
        legacyPaths.forEach((legacyPath) => {
          _.unset(cleanDendronConfig, legacyPath);
        });

        // recursively populate missing defaults
        const migratedConfig = _.defaultsDeep(
          cleanDendronConfig,
          defaultV4Config
        );

        return { data: { dendronConfig: migratedConfig, wsConfig } };
      },
    },
  ],
};

/**
 * Migrations are sorted by version numbers, from greatest to least
 */
export const ALL_MIGRATIONS: Migrations[] = [
  CONFIG_MIGRATIONS,
  {
    version: "0.55.2",
    changes: [
      {
        name: "migrate note lookup config",
        func: async ({ dendronConfig, wsConfig }) => {
          const oldLookupCreateBehavior = _.get(
            wsConfig?.settings,
            "dendron.defaultLookupCreateBehavior",
            undefined
          ) as LegacyLookupSelectionType;
          if (oldLookupCreateBehavior !== undefined) {
            let newValue;
            switch (oldLookupCreateBehavior) {
              case "selection2link": {
                newValue = LookupSelectionModeEnum.link;
                break;
              }
              case "none": {
                newValue = LookupSelectionModeEnum.none;
                break;
              }
              case "selectionExtract":
              default: {
                newValue = LookupSelectionModeEnum.extract;
                break;
              }
            }
            ConfigUtils.setNoteLookupProps(
              dendronConfig,
              "selectionMode",
              newValue
            );
          }

          return { data: { dendronConfig, wsConfig } };
        },
      },
    ],
  },
  {
    version: "0.51.4",
    changes: [
      {
        name: "migrate scratch config",
        func: async ({ dendronConfig, wsConfig }) => {
          const wsName = _.get(
            wsConfig?.settings,
            "dendron.defaultScratchName"
          );
          if (wsName) {
            ConfigUtils.setScratchProps(dendronConfig, "name", wsName);
          }

          const wsDateFormat = _.get(
            wsConfig?.settings,
            "dendron.defaultScratchDateFormat"
          );
          if (wsDateFormat) {
            ConfigUtils.setScratchProps(
              dendronConfig,
              "dateFormat",
              wsDateFormat
            );
          }

          const wsAddBehavior = _.get(
            wsConfig?.settings,
            "dendron.defaultScratchAddBehavior"
          );
          if (wsAddBehavior) {
            ConfigUtils.setScratchProps(
              dendronConfig,
              "addBehavior",
              wsAddBehavior
            );
          }
          return { data: { dendronConfig, wsConfig } };
        },
      },
    ],
  },
  {
    version: "0.47.1",
    changes: [
      {
        name: "migrate journal config",
        func: async ({ dendronConfig, wsConfig }) => {
          const wsDailyDomain = _.get(
            wsConfig?.settings,
            "dendron.dailyJournalDomain"
          );
          if (wsDailyDomain) {
            ConfigUtils.setJournalProps(
              dendronConfig,
              "dailyDomain",
              wsDailyDomain
            );
          }

          const wsName = _.get(
            wsConfig?.settings,
            "dendron.defaultJournalName"
          );
          if (wsName) {
            ConfigUtils.setJournalProps(dendronConfig, "name", wsName);
          }

          const wsDateFormat = _.get(
            wsConfig?.settings,
            "dendron.defaultJournalDateFormat"
          );
          if (wsDateFormat) {
            ConfigUtils.setJournalProps(
              dendronConfig,
              "dateFormat",
              wsDateFormat
            );
          }

          const wsAddBehavior = _.get(
            wsConfig?.settings,
            "dendron.defaultJournalAddBehavior"
          );
          if (wsAddBehavior) {
            ConfigUtils.setJournalProps(
              dendronConfig,
              "addBehavior",
              wsAddBehavior
            );
          }
          return { data: { dendronConfig, wsConfig } };
        },
      },
    ],
  },
  {
    version: "0.46.0",
    changes: [
      {
        name: "update cache",
        func: async ({ dendronConfig, wsConfig, wsService }) => {
          const { wsRoot, config } = wsService;
          const vaults = ConfigUtils.getVaults(config);
          await Promise.all(
            vaults.map((vault) => {
              return removeCache(vault2Path({ wsRoot, vault }));
            })
          );
          const segStatus = SegmentClient.getStatus();
          // use has not disabled telemetry prior to upgrade
          if (
            segStatus !== TelemetryStatus.DISABLED_BY_COMMAND &&
            !ConfigUtils.getWorkspace(config).disableTelemetry
          ) {
            SegmentClient.enable(TelemetryStatus.ENABLED_BY_MIGRATION);
          }
          return { data: { dendronConfig, wsConfig } };
        },
      },
    ],
  },
];
