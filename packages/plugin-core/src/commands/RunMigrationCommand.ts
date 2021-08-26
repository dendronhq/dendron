import { ALL_MIGRATIONS, MigrationChangeSetStatus, Migrations, MigrationServce } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { NodeJSUtils } from "@dendronhq/common-server";
import { getWS } from "../workspace";

type CommandOpts = {
  version: string;
};
type CommandInput = {
  version: string;
}
type CommandOutput = MigrationChangeSetStatus[];

export class RunMigrationCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.RUN_MIGRATION.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    const migrationItems: vscode.QuickPickItem[] = _.map(ALL_MIGRATIONS, (migration) => {
      return {
        label: migration.version,
        description: `${migration.changes.length} changes`,
        detail: migration.changes.map((set) => {
          return set.name
        }).join("\n"),
        alwaysShow: true,
      }
    });

    const selected = await vscode.window.showQuickPick(migrationItems).then((value) => {
      if (!value) {
        return;
      }
      return { version: value.label };
    });

    return selected;
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const { version } = opts;
    const migrationsToRun: Migrations[] = _.filter(ALL_MIGRATIONS, (migration) => migration.version === version);
    const ws = getWS();
    const response = vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Applying migration...",
        cancellable: false,
      },
      async () => {
        const out = await MigrationServce.applyMigrationChanges({
          previousVersion: "0.0.0",
          currentVersion: NodeJSUtils.getVersionFromPkg(),
          migration: migrationsToRun[0],
          dendronConfig: ws.getEngine().config,
          wsConfig: await ws.getWorkspaceSettings(),
          wsService: ws.workspaceService!,
          logger: this.L
        });
        return out;
      }
    ).then((resp) => {
      resp.map((status) => {
        if (status.error) {
          vscode.window.showErrorMessage("Error: ", status.error.message);
        } else {
          vscode.window.showInformationMessage(`${status.data.changeName} (v${status.data.version}) apply status: ${status.data.status}`);
        }
      })
      return resp;
    });
    return response;
  }
}