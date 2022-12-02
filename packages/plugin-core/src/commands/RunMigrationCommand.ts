import { WorkspaceType } from "@dendronhq/common-all";
import {
  MIGRATION_ENTRIES,
  MigrationChangeSetStatus,
  Migrations,
  MigrationService,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";

type CommandOpts = {
  version: string;
};
type CommandInput = {
  version: string;
};
type CommandOutput = MigrationChangeSetStatus[];

export class RunMigrationCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.RUN_MIGRATION.key;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  async gatherInputs(opts?: CommandInput): Promise<CommandInput | undefined> {
    const migrationItems: vscode.QuickPickItem[] = _.map(
      MIGRATION_ENTRIES,
      (migration) => {
        return {
          label: migration.version,
          description: `${migration.changes.length} change(s)`,
          detail: migration.changes
            .map((set) => {
              return set.name;
            })
            .join("\n"),
          alwaysShow: true,
        };
      }
    );

    if (_.isUndefined(opts)) {
      const selected = await vscode.window
        .showQuickPick(migrationItems)
        .then((value) => {
          if (!value) {
            return;
          }
          return { version: value.label };
        });
      return selected;
    } else {
      return opts;
    }
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const { version } = opts;
    const migrationsToRun: Migrations[] = _.filter(
      MIGRATION_ENTRIES,
      (migration) => migration.version === version
    );
    const ws = this.extension.getDWorkspace();
    const { wsRoot } = ws;
    const config = await ws.config;
    const wsService = new WorkspaceService({ wsRoot });

    const wsConfig =
      ws.type === WorkspaceType.CODE
        ? wsService.getCodeWorkspaceSettingsSync()
        : undefined;

    const response = vscode.window
      .withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Applying migration...",
          cancellable: false,
        },
        async () => {
          const out = await MigrationService.applyMigrationRules({
            currentVersion: version,
            previousVersion: "0.0.0",
            migrations: migrationsToRun,
            wsService,
            logger: this.L,
            wsConfig,
            dendronConfig: config,
          });
          return out;
        }
      )
      .then((resp) => {
        resp.map((status) => {
          if (status.error) {
            vscode.window.showErrorMessage("Error: ", status.error.message);
          } else {
            vscode.window.showInformationMessage(
              `${status.data.changeName} (v${status.data.version}) apply status: ${status.data.status}`
            );
          }
        });
        return resp;
      });
    return response;
  }
}
