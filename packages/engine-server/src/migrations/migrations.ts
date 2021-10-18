import {
  LegacyLookupSelectionType,
  LookupConfig,
  LookupSelectionModeEnum,
  DendronError,
  ConfigUtils,
  ScratchConfig,
  JournalConfig,
} from "@dendronhq/common-all";
import {
  SegmentClient,
  TelemetryStatus,
  vault2Path,
} from "@dendronhq/common-server";
import _ from "lodash";
import fs from "fs-extra";
import { DConfig, pathMap } from "../config";
import { removeCache } from "../utils";
import { Migrations } from "./types";
import { MigrationUtils } from "./utils";

export const CONFIG_MIGRATIONS: Migrations = {
  version: "0.64.0",
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

        const defaultV3Config = ConfigUtils.genDefaultConfig();
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

        // mapping how we want each keys to be migrated.
        const flip = (value: boolean): boolean => !value; // value is flipped during migration.
        const skip = (_value: any) => undefined; // don't migrate. let other mappings do it.
        const migrationIterateeMap = new Map<string, Function>([
          ["commands.lookup", skip],
          ["commands.lookup.note", skip],
          [
            "commands.lookup.note.selectionMode",
            (value: any) => {
              switch (value) {
                case "selection2link": {
                  return "link";
                }
                case "none": {
                  return "none";
                }
                case "selectionExtract":
                default: {
                  return "extract";
                }
              }
            },
          ],
          ["commands.insertNoteLink", skip],
          ["commands.insertNoteIndex", skip],
          ["commands.randomNote", skip],
          ["workspace.enableAutoCreateOnDefinition", flip],
          ["workspace.enableXVaultWikiLink", flip],
          ["workspace.journal", skip],
          ["workspace.scratch", skip],
          ["workspace.graph", skip],
        ]);

        // legacy paths to remove from config;
        const legacyPaths: string[] = [];
        // migrate each path mapped in current config version
        pathMap.forEach((value, key) => {
          const legacyPath = value.target;
          const maybeLegacyConfig = _.get(cleanDendronConfig, legacyPath);
          const alreadyFilled = _.has(cleanDendronConfig, key);
          let valueToFill;
          if (_.isUndefined(maybeLegacyConfig)) {
            // legacy property doesn't have a value.
            valueToFill = _.get(defaultV3Config, key);
          } else {
            // there is a legacy value.
            // check if this mapping needs special treatment.
            let iteratee = migrationIterateeMap.get(key);
            if (_.isUndefined(iteratee)) {
              // otherwise, move it as is.
              iteratee = _.identity;
            }
            valueToFill = iteratee(maybeLegacyConfig);
          }
          if (!alreadyFilled && !_.isUndefined(valueToFill)) {
            // if the property isn't already filled, fill it with determined value.
            _.set(cleanDendronConfig, key, valueToFill);
          }

          legacyPaths.push(legacyPath);
        });

        // set config version.
        _.set(cleanDendronConfig, "version", 3);

        // remove legacy property from config after migration.
        legacyPaths.forEach((legacyPath) => {
          _.unset(cleanDendronConfig, legacyPath);
        });
        return { data: { dendronConfig: cleanDendronConfig, wsConfig } };
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
          dendronConfig.commands!.lookup = ConfigUtils.genDefaultConfig()
            .commands!.lookup as LookupConfig;
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
            dendronConfig.commands!.lookup.note.selectionMode = newValue;
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
          const defaultConfig = ConfigUtils.genDefaultConfig();
          dendronConfig.workspace!.scratch = defaultConfig.workspace!
            .scratch as ScratchConfig;
          if (_.get(wsConfig?.settings, "dendron.defaultScratchName")) {
            dendronConfig.workspace!.scratch.name = _.get(
              wsConfig?.settings,
              "dendron.defaultScratchName"
            );
          }
          if (_.get(wsConfig?.settings, "dendron.defaultScratchDateFormat")) {
            dendronConfig.workspace!.scratch.dateFormat = _.get(
              wsConfig?.settings,
              "dendron.defaultScratchDateFormat"
            );
          }
          if (_.get(wsConfig?.settings, "dendron.defaultScratchAddBehavior")) {
            dendronConfig.workspace!.scratch.addBehavior = _.get(
              wsConfig?.settings,
              "dendron.defaultScratchAddBehavior"
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
        name: "don't switch to legacy preview if not currently on it",
        func: async ({ dendronConfig, wsConfig }) => {
          const previewV2Enabled = dendronConfig.dev?.enablePreviewV2;
          if (!previewV2Enabled) {
            _.set(dendronConfig, "dev.previewV2Enabled", false);
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
          const defaultConfig = ConfigUtils.genDefaultConfig();
          dendronConfig.workspace!.journal = defaultConfig.workspace!
            .journal as JournalConfig;
          if (_.get(wsConfig?.settings, "dendron.dailyJournalDomain")) {
            dendronConfig.workspace!.journal.dailyDomain = _.get(
              wsConfig?.settings,
              "dendron.dailyJournalDomain"
            );
          }
          if (_.get(wsConfig?.settings, "dendron.defaultJournalName")) {
            dendronConfig.workspace!.journal.name = _.get(
              wsConfig?.settings,
              "dendron.defaultJournalName"
            );
          }
          if (_.get(wsConfig?.settings, "dendron.defaultJournalDateFormat")) {
            dendronConfig.workspace!.journal.dateFormat = _.get(
              wsConfig?.settings,
              "dendron.defaultJournalDateFormat"
            );
          }
          if (_.get(wsConfig?.settings, "dendron.defaultJournalAddBehavior")) {
            dendronConfig.workspace!.journal.addBehavior = _.get(
              wsConfig?.settings,
              "dendron.defaultJournalAddBehavior"
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
            !config.workspace!.disableTelemetry
          ) {
            SegmentClient.enable(TelemetryStatus.ENABLED_BY_MIGRATION);
          }
          return { data: { dendronConfig, wsConfig } };
        },
      },
    ],
  },
];
