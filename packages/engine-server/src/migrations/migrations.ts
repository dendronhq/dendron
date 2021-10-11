import { 
  LegacyLookupConfig, 
  LegacyLookupSelectionType, 
  InsertNoteLinkAliasModeEnum,
  InsertNoteLinkConfig,
  InsertNoteIndexConfig,
  LookupConfig,
  NoteLookupConfig,
  LookupSelectionMode,
  LookupSelectionModeEnum,
  ScratchConfig,
  DendronError,
  genDefaultCommandConfig,
  CURRENT_CONFIG_VERSION,
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

/**
 * Migrations are sorted by version numbers, from greatest to least
 */
export const ALL_MIGRATIONS: Migrations[] = [
  {
    version: "0.63.0",
    changes: [
      {
        name: "migrate command config",
        func: async ({ dendronConfig, wsConfig, wsService }) => {
          // back up existing config
          const backupPath = DConfig.createBackup(wsService.wsRoot, "migrate-command-config");
          if (!fs.existsSync(backupPath)) {
            return {
              error: new DendronError({ message: "Backup failed during config migration. Exiting without migration." }),
              data: {
                dendronConfig,
                wsConfig
              }
            }
          }
          
          // command namespace
          const defaultCommandConfig = genDefaultCommandConfig();
          const rawDendronConfig = DConfig.getRaw(wsService.wsRoot);
          let commands = !_.isUndefined(rawDendronConfig.commands)
            ? rawDendronConfig.commands
            : defaultCommandConfig;
          
          if (commands === null) {
            commands = defaultCommandConfig;
          }
     
          // migrate randomNote
          const maybeOldRandomNote = rawDendronConfig.randomNote;
          if (!_.isUndefined(maybeOldRandomNote)) {
            commands.randomNote = maybeOldRandomNote;
            delete rawDendronConfig.randomNote;
            delete dendronConfig.randomNote;
          }
          if (!commands.randomNote) {
            commands.randomNote = defaultCommandConfig.randomNote;
          }
      
          // migrate insertNote
          const maybeOldDefaultInsertHierarchy = dendronConfig.defaultInsertHierarchy;
          if (!_.isUndefined(maybeOldDefaultInsertHierarchy)) {
            commands.insertNote = {
              initialValue: maybeOldDefaultInsertHierarchy
            };
            delete rawDendronConfig.defaultInsertHierarchy;
            delete dendronConfig.defaultInsertHierarchy;
          }
          if (!commands.insertNote) {
            commands.insertNote = defaultCommandConfig.insertNote;
          }

          // migrate insertNoteLink
          const maybeOldInsertNoteLink = rawDendronConfig.insertNoteLink;
          if (!_.isUndefined(maybeOldInsertNoteLink)) {
            commands.insertNoteLink = {
              aliasMode: ( 
                maybeOldInsertNoteLink.aliasMode as unknown 
              ) as InsertNoteLinkAliasModeEnum,
              enableMultiSelect: maybeOldInsertNoteLink.multiSelect
            } as InsertNoteLinkConfig
            delete rawDendronConfig.insertNoteLink;
            delete dendronConfig.insertNoteLink;
          }

          // migrate insertNoteIndex
          const maybeOldInsertNoteIndex = rawDendronConfig.insertNoteIndex;
          if (!_.isUndefined(maybeOldInsertNoteIndex)) {
            if (!_.isUndefined(maybeOldInsertNoteIndex.marker)) {
              commands.insertNoteIndex = {
                enableMarker: maybeOldInsertNoteIndex.marker
              } as InsertNoteIndexConfig;
              delete rawDendronConfig.insertNoteIndex;
              delete dendronConfig.insertNoteIndex;
            }
          }

          // migrate lookup
          const maybeOldLookup = rawDendronConfig.lookup;
          let selectionMode = LookupSelectionModeEnum.extract as LookupSelectionMode;
          let leaveTrace: boolean;
          if(_.isUndefined(maybeOldLookup)) {
            if(commands.lookup.note.selectionMode) {
              selectionMode = commands.lookup.note.selectionMode
            } else {
              selectionMode = defaultCommandConfig.lookup.note.selectionMode;
            }
            if(commands.lookup.note.leaveTrace) {
              leaveTrace = commands.lookup.note.leaveTrace;
            } else {
              leaveTrace = defaultCommandConfig.lookup.note.leaveTrace;
            }
          } else {
            switch(maybeOldLookup.note.selectionType) {
              case "selectionExtract": {
                selectionMode = LookupSelectionModeEnum.extract;
                break;
              }
              case "selection2link": {
                selectionMode = LookupSelectionModeEnum.link;
                break;
              }
              case "none": {
                selectionMode = LookupSelectionModeEnum.none;
                break;
              }
              default: break;
            }

            leaveTrace = maybeOldLookup.note.leaveTrace;
          }

          const maybeOldLookupConfirmVaultOnCreate = rawDendronConfig.lookupConfirmVaultOnCreate;
          let confirmVaultOnCreate;
          if (_.isUndefined(maybeOldLookupConfirmVaultOnCreate)) {
            if (commands.lookup.note.confirmVaultOnCreate) {
              confirmVaultOnCreate = commands.lookup.note.confirmVaultOnCreate;
            } else {
              confirmVaultOnCreate = genDefaultCommandConfig().lookup.note.confirmVaultOnCreate;
            }
          } else {
            confirmVaultOnCreate = maybeOldLookupConfirmVaultOnCreate;
          }
          commands.lookup = {
            note: {
              selectionMode,
              confirmVaultOnCreate,
              leaveTrace,
            } as NoteLookupConfig
          } as LookupConfig;
          delete rawDendronConfig.lookup;
          delete rawDendronConfig.lookupConfirmVaultOnCreate;
          
          delete dendronConfig.lookup;
          delete dendronConfig.lookupConfirmVaultOnCreate;
          rawDendronConfig.commands = commands;
          rawDendronConfig.version = CURRENT_CONFIG_VERSION;

          Object.assign(dendronConfig, rawDendronConfig);
          
          return { data: { dendronConfig, wsConfig } };
        }
      }
    ]
  },
  {
    version: "0.55.2",
    changes: [
      {
        name: "migrate note lookup config",
        func: async ({ dendronConfig, wsConfig }) => {
          dendronConfig.lookup = DConfig.genDefaultConfig().lookup as LegacyLookupConfig;
          const oldLookupCreateBehavior = _.get(
            wsConfig.settings, 
            "dendron.defaultLookupCreateBehavior",
            undefined,
          ) as LegacyLookupSelectionType;
          if (oldLookupCreateBehavior !== undefined) {
            dendronConfig.lookup.note.selectionType = oldLookupCreateBehavior;
          }

          return { data: { dendronConfig, wsConfig }};
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
          dendronConfig.scratch = DConfig.genDefaultConfig()
            .scratch as ScratchConfig;
          if (_.get(wsConfig.settings, "dendron.defaultScratchName")) {
            dendronConfig.scratch.name = _.get(
              wsConfig.settings,
              "dendron.defaultScratchName"
            );
          }
          if (_.get(wsConfig.settings, "dendron.defaultScratchDateFormat")) {
            dendronConfig.scratch.dateFormat = _.get(
              wsConfig.settings,
              "dendron.defaultScratchDateFormat"
            );
          }
          if (_.get(wsConfig.settings, "dendron.defaultScratchAddBehavior")) {
            dendronConfig.scratch.addBehavior = _.get(
              wsConfig.settings,
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
          dendronConfig.journal = DConfig.genDefaultConfig().journal;
          if (_.get(wsConfig.settings, "dendron.dailyJournalDomain")) {
            dendronConfig.journal.dailyDomain = _.get(
              wsConfig.settings,
              "dendron.dailyJournalDomain"
            );
          }
          if (_.get(wsConfig.settings, "dendron.defaultJournalName")) {
            dendronConfig.journal.name = _.get(
              wsConfig.settings,
              "dendron.defaultJournalName"
            );
          }
          if (_.get(wsConfig.settings, "dendron.defaultJournalDateFormat")) {
            dendronConfig.journal.dateFormat = _.get(
              wsConfig.settings,
              "dendron.defaultJournalDateFormat"
            );
          }
          if (_.get(wsConfig.settings, "dendron.defaultJournalAddBehavior")) {
            dendronConfig.journal.addBehavior = _.get(
              wsConfig.settings,
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
          await Promise.all(
            wsService.config.vaults.map((vault) => {
              return removeCache(vault2Path({ wsRoot, vault }));
            })
          );
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
