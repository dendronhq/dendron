import { 
  LegacyLookupConfig, 
  LegacyLookupSelectionType, 
  InsertNoteLinkAliasModeEnum,
  InsertNoteLinkConfig,
  InsertNoteIndexConfig,
  LookupConfig,
  NoteLookupConfig,
  LookupSelectionModeEnum,
  ScratchConfig,
  DendronError,
  DendronCommandConfig,
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
          const commands = {
            
          } as DendronCommandConfig;
     
          // migrate randomNote
          const maybeOldRandomNote = dendronConfig.randomNote;
          if (!_.isUndefined(maybeOldRandomNote)) {
            commands.randomNote = maybeOldRandomNote!;
            delete dendronConfig.randomNote;
          }
      
          // migrate insertNote
          const maybeOldDefaultInsertHierarchy = dendronConfig.defaultInsertHierarchy;
          if (!_.isUndefined(maybeOldDefaultInsertHierarchy)) {
            commands.insertNote = {
              initialValue: maybeOldDefaultInsertHierarchy
            };
            delete dendronConfig.defaultInsertHierarchy;
          }

          // migrate insertNoteLink
          const maybeOldInsertNoteLink = dendronConfig.insertNoteLink;
          if (!_.isUndefined(maybeOldInsertNoteLink)) {
            commands.insertNoteLink = {
              aliasMode: ( 
                maybeOldInsertNoteLink.aliasMode as unknown 
              ) as InsertNoteLinkAliasModeEnum,
              enableMultiSelect: maybeOldInsertNoteLink.multiSelect
            } as InsertNoteLinkConfig
            delete dendronConfig.insertNoteLink;
          }

          // migrate insertNoteIndex
          const maybeOldInsertNoteIndex = dendronConfig.insertNoteIndex;
          if (!_.isUndefined(maybeOldInsertNoteIndex)) {
            if (!_.isUndefined(maybeOldInsertNoteIndex.marker)) {
              commands.insertNoteIndex = {
                enableMarker: maybeOldInsertNoteIndex.marker
              } as InsertNoteIndexConfig;
              delete dendronConfig.insertNoteIndex;
            }
          }

          // migrate lookup
          const oldLookup = dendronConfig.lookup!;
          let selectionMode = LookupSelectionModeEnum.extract;
          switch(oldLookup.note.selectionType) {
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
          const leaveTrace = oldLookup.note.leaveTrace 
            ? oldLookup.note.leaveTrace
            : false;

          const maybeOldLookupConfirmVaultOnCreate = dendronConfig.lookupConfirmVaultOnCreate;
          const confirmVaultOnCreate = _.isUndefined(maybeOldLookupConfirmVaultOnCreate)
            ? false
            : maybeOldLookupConfirmVaultOnCreate;
          commands.lookup = {
            note: {
              selectionMode,
              confirmVaultOnCreate,
              leaveTrace,
            } as NoteLookupConfig
          } as LookupConfig;

          dendronConfig.commands = commands;

          return { data: { dendronConfig, wsConfig }};
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
