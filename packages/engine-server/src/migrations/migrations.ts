import {
  LegacyLookupConfig,
  LegacyLookupSelectionType,
  InsertNoteLinkConfig,
  InsertNoteIndexConfig,
  LookupConfig,
  NoteLookupConfig,
  RandomNoteConfig,
  LookupSelectionMode,
  LookupSelectionModeEnum,
  LegacyScratchConfig,
  DendronError,
  genDefaultCommandConfig,
  CURRENT_CONFIG_VERSION,
  DVault,
  StrictV1,
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
          const backupPath = DConfig.createBackup(
            wsService.wsRoot,
            "migrate-command-config"
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
          if (
            !_.isUndefined(maybeOldRandomNote) &&
            maybeOldRandomNote !== null
          ) {
            let include;
            let exclude;
            if (
              !_.isUndefined(maybeOldRandomNote.include) &&
              maybeOldRandomNote.include !== null
            ) {
              include = maybeOldRandomNote.include;
            }
            if (
              !_.isUndefined(maybeOldRandomNote.exclude) &&
              maybeOldRandomNote.exclude !== null
            ) {
              exclude = maybeOldRandomNote.exclude;
            }

            const randomNote = {} as RandomNoteConfig;
            if (!_.isUndefined(include)) {
              randomNote["include"] = include;
            }

            if (!_.isUndefined(exclude)) {
              randomNote["exclude"] = exclude;
            }

            commands.randomNote = randomNote;
            delete rawDendronConfig.randomNote;
            delete dendronConfig.randomNote;
          }
          if (!commands.randomNote) {
            commands.randomNote = defaultCommandConfig.randomNote;
          }

          // migrate insertNote
          const maybeOldDefaultInsertHierarchy =
            dendronConfig.defaultInsertHierarchy;
          if (!_.isUndefined(maybeOldDefaultInsertHierarchy)) {
            commands.insertNote =
              maybeOldDefaultInsertHierarchy === null
                ? defaultCommandConfig.insertNote
                : (commands.insertNote = {
                    initialValue: maybeOldDefaultInsertHierarchy,
                  });
            delete rawDendronConfig.defaultInsertHierarchy;
            delete dendronConfig.defaultInsertHierarchy;
          }
          if (!commands.insertNote) {
            commands.insertNote = defaultCommandConfig.insertNote;
          }

          // migrate insertNoteLink
          const maybeOldInsertNoteLink = rawDendronConfig.insertNoteLink;
          if (!_.isUndefined(maybeOldInsertNoteLink)) {
            let enableMultiSelect;
            let aliasMode;
            if (maybeOldInsertNoteLink === null) {
              enableMultiSelect =
                defaultCommandConfig.insertNoteLink.enableMultiSelect;
              aliasMode = defaultCommandConfig.insertNoteLink.aliasMode;
            } else {
              if (
                _.isUndefined(maybeOldInsertNoteLink.multiSelect) ||
                maybeOldInsertNoteLink.multiSelect === null
              ) {
                enableMultiSelect =
                  defaultCommandConfig.insertNoteLink.enableMultiSelect;
              } else {
                enableMultiSelect = maybeOldInsertNoteLink.multiSelect;
              }

              if (
                _.isUndefined(maybeOldInsertNoteLink.aliasMode) ||
                maybeOldInsertNoteLink.aliasMode === null
              ) {
                aliasMode = defaultCommandConfig.insertNoteLink.aliasMode;
              } else {
                aliasMode = maybeOldInsertNoteLink.aliasMode;
              }
            }
            commands.insertNoteLink = {
              aliasMode,
              enableMultiSelect,
            } as InsertNoteLinkConfig;
            delete rawDendronConfig.insertNoteLink;
            delete dendronConfig.insertNoteLink;
          }
          if (!commands.insertNoteLink) {
            commands.insertNoteLink = defaultCommandConfig.insertNoteLink;
          }

          // migrate insertNoteIndex
          const maybeOldInsertNoteIndex = rawDendronConfig.insertNoteIndex;
          if (!_.isUndefined(maybeOldInsertNoteIndex)) {
            if (maybeOldInsertNoteIndex !== null) {
              if (!_.isUndefined(maybeOldInsertNoteIndex.marker)) {
                const enableMarker =
                  maybeOldInsertNoteIndex.marker === null
                    ? defaultCommandConfig.insertNoteIndex.enableMarker
                    : maybeOldInsertNoteIndex.marker;
                commands.insertNoteIndex = {
                  enableMarker,
                } as InsertNoteIndexConfig;
                delete rawDendronConfig.insertNoteIndex;
                delete dendronConfig.insertNoteIndex;
              }
            } else {
              commands.insertNoteIndex = defaultCommandConfig.insertNoteIndex;
              delete rawDendronConfig.insertNoteIndex;
              delete dendronConfig.insertNoteIndex;
            }
          }
          if (!commands.insertNoteIndex) {
            commands.insertNoteIndex = defaultCommandConfig.insertNoteIndex;
          }

          // migrate lookup
          const maybeOldLookup = rawDendronConfig.lookup;
          let selectionMode =
            LookupSelectionModeEnum.extract as LookupSelectionMode;
          let leaveTrace: boolean = false;
          if (_.isUndefined(maybeOldLookup) || maybeOldLookup === null) {
            if (commands.lookup) {
              if (commands.lookup.note) {
                if (commands.lookup.note.selectionMode) {
                  selectionMode = commands.lookup.note.selectionMode;
                } else {
                  selectionMode =
                    defaultCommandConfig.lookup.note.selectionMode;
                }
                if (commands.lookup.note.leaveTrace) {
                  leaveTrace = commands.lookup.note.leaveTrace;
                } else {
                  leaveTrace = defaultCommandConfig.lookup.note.leaveTrace;
                }
              } else {
                commands.lookup.note = defaultCommandConfig.lookup.note;
              }
            } else {
              commands.lookup = defaultCommandConfig.lookup;
            }
          } else if (maybeOldLookup.note === null) {
            selectionMode = defaultCommandConfig.lookup.note.selectionMode;
            leaveTrace = defaultCommandConfig.lookup.note.leaveTrace;
          } else {
            switch (maybeOldLookup.note.selectionType) {
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
              default: {
                selectionMode = defaultCommandConfig.lookup.note.selectionMode;
                break;
              }
            }
            if (
              _.isUndefined(maybeOldLookup.note.leaveTrace) ||
              maybeOldLookup.note.leaveTrace === null
            ) {
              leaveTrace = defaultCommandConfig.lookup.note.leaveTrace;
            } else {
              leaveTrace = maybeOldLookup.note.leaveTrace;
            }
          }

          const maybeOldLookupConfirmVaultOnCreate =
            rawDendronConfig.lookupConfirmVaultOnCreate;
          let confirmVaultOnCreate;
          if (
            _.isUndefined(maybeOldLookupConfirmVaultOnCreate) ||
            maybeOldLookupConfirmVaultOnCreate === null
          ) {
            if (commands.lookup.note.confirmVaultOnCreate) {
              confirmVaultOnCreate = commands.lookup.note.confirmVaultOnCreate;
            } else {
              confirmVaultOnCreate =
                defaultCommandConfig.lookup.note.confirmVaultOnCreate;
            }
          } else {
            confirmVaultOnCreate = maybeOldLookupConfirmVaultOnCreate;
          }
          commands.lookup = {
            note: {
              selectionMode,
              confirmVaultOnCreate,
              leaveTrace,
            } as NoteLookupConfig,
          } as LookupConfig;
          delete rawDendronConfig.lookup;
          delete rawDendronConfig.lookupConfirmVaultOnCreate;

          delete dendronConfig.lookup;
          delete dendronConfig.lookupConfirmVaultOnCreate;
          rawDendronConfig.commands = commands;
          rawDendronConfig.version = CURRENT_CONFIG_VERSION;

          Object.assign(dendronConfig, rawDendronConfig);

          return { data: { dendronConfig, wsConfig } };
        },
      },
    ],
  },
  {
    version: "0.55.2",
    changes: [
      {
        name: "migrate note lookup config",
        func: async ({ dendronConfig, wsConfig }) => {
          dendronConfig.lookup = DConfig.genDefaultConfig()
            .lookup as LegacyLookupConfig;
          const oldLookupCreateBehavior = _.get(
            wsConfig?.settings,
            "dendron.defaultLookupCreateBehavior",
            undefined
          ) as LegacyLookupSelectionType;
          if (oldLookupCreateBehavior !== undefined) {
            dendronConfig.lookup.note.selectionType = oldLookupCreateBehavior;
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
          dendronConfig.scratch = DConfig.genDefaultConfig()
            .scratch as LegacyScratchConfig;
          if (_.get(wsConfig?.settings, "dendron.defaultScratchName")) {
            dendronConfig.scratch.name = _.get(
              wsConfig?.settings,
              "dendron.defaultScratchName"
            );
          }
          if (_.get(wsConfig?.settings, "dendron.defaultScratchDateFormat")) {
            dendronConfig.scratch.dateFormat = _.get(
              wsConfig?.settings,
              "dendron.defaultScratchDateFormat"
            );
          }
          if (_.get(wsConfig?.settings, "dendron.defaultScratchAddBehavior")) {
            dendronConfig.scratch.addBehavior = _.get(
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
          dendronConfig.journal = (
            DConfig.genDefaultConfig() as StrictV1
          ).journal;
          if (_.get(wsConfig?.settings, "dendron.dailyJournalDomain")) {
            dendronConfig.journal.dailyDomain = _.get(
              wsConfig?.settings,
              "dendron.dailyJournalDomain"
            );
          }
          if (_.get(wsConfig?.settings, "dendron.defaultJournalName")) {
            dendronConfig.journal.name = _.get(
              wsConfig?.settings,
              "dendron.defaultJournalName"
            );
          }
          if (_.get(wsConfig?.settings, "dendron.defaultJournalDateFormat")) {
            dendronConfig.journal.dateFormat = _.get(
              wsConfig?.settings,
              "dendron.defaultJournalDateFormat"
            );
          }
          if (_.get(wsConfig?.settings, "dendron.defaultJournalAddBehavior")) {
            dendronConfig.journal.addBehavior = _.get(
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
          const vaults = DConfig.getConfig({
            config,
            path: "workspace.vaults",
            required: true,
          }) as DVault[];
          await Promise.all(
            vaults.map((vault) => {
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
