import {
  SegmentClient,
  TelemetryStatus,
  vault2Path,
} from "@dendronhq/common-server";
import _ from "lodash";
import { DConfig } from "../config";
import { removeCache } from "../utils";
import { Migrations } from "./types";

export const ALL_MIGRATIONS: Migrations[] = [
  {
    version: "0.46.1",
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
