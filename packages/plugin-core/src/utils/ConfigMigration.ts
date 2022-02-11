import {
  CURRENT_CONFIG_VERSION,
  IntermediateDendronConfig,
  MigrationEvents,
} from "@dendronhq/common-all";
import {
  MigrationChangeSetStatus,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { AnalyticsUtils } from "./analytics";

/**
 * Utility methods that are only used in plugin-core.
 * Bulk of the actual migration related logic is in [[../packages/engine-server/src/migrations/utils.ts]]
 */
export class ConfigMigrationUtils {
  static maybePromptConfigMigration(opts: {
    dendronConfig: IntermediateDendronConfig;
    wsService: WorkspaceService;
    currentVersion: string;
  }) {
    const { dendronConfig } = opts;
    if (dendronConfig.version !== CURRENT_CONFIG_VERSION) {
      ConfigMigrationUtils.showConfigMigrationConfirmationMessage(opts);
      return true;
    }
    return false;
  }

  static showConfigMigrationConfirmationMessage(opts: {
    dendronConfig: IntermediateDendronConfig;
    wsService: WorkspaceService;
    currentVersion: string;
  }) {
    vscode.window
      .showInformationMessage(
        "We notice that your dendron.yml is not up to date. Would you like to migrate to the latest configuration? (A backup of your current configuration will be made before the migration)",
        "Migrate Configuration"
      )
      .then(async (resp) => {
        if (resp === "Migrate Configuration") {
          await ConfigMigrationUtils.showConfigMigrationNoticeModal(opts);
        }
      });
  }

  static async showConfigMigrationNoticeModal(opts: {
    dendronConfig: IntermediateDendronConfig;
    wsService: WorkspaceService;
    currentVersion: string;
  }) {
    const { dendronConfig, wsService, currentVersion } = opts;
    let configMigrationChanges: MigrationChangeSetStatus[] = [];
    await vscode.window
      .showInformationMessage(
        "We are about to migrate configurations related to publishing. Please note that if you have an automated pipeline set up for publishing, you need to manually upgrade dendron-cli to avoid errors due to configuration mismatch.",
        { modal: true },
        { title: "I Understand" }
      )
      .then(async (resp) => {
        if (resp?.title === "I Understand") {
          configMigrationChanges =
            await wsService.runConfigMigrationIfNecessary({
              currentVersion,
              dendronConfig,
            });
          if (configMigrationChanges.length > 0) {
            configMigrationChanges.forEach(
              (change: MigrationChangeSetStatus) => {
                const event = _.isUndefined(change.error)
                  ? MigrationEvents.MigrationSucceeded
                  : MigrationEvents.MigrationFailed;
                AnalyticsUtils.track(event, {
                  data: change.data,
                });
              }
            );
            vscode.window.showInformationMessage(
              "Migrated to the newest configurations. You can find a backup of the original file in your workspace root."
            );
          }
        } else {
          vscode.window.showInformationMessage("Migration cancelled.");
        }
      });

    return configMigrationChanges;
  }
}
