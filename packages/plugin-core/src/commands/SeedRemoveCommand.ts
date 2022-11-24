import {
  DendronError,
  ERROR_SEVERITY,
  SEED_REGISTRY,
} from "@dendronhq/common-all";
import { SeedSvcResp } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { SeedCommandBase } from "./SeedCommandBase";

type CommandOpts = {
  seedId: Extract<keyof typeof SEED_REGISTRY, string>;
};

type CommandInput = {
  seedId: Extract<keyof typeof SEED_REGISTRY, string>;
};

type CommandOutput = SeedSvcResp;

export class SeedRemoveCommand extends SeedCommandBase<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SEED_REMOVE.key;
  private readonly NO_SEEDS_MSG: string = "no seeds in the current workspace";

  async gatherInputs(): Promise<CommandInput | undefined> {
    const seeds = await this.getSeedSvc().getSeedsInWorkspace();
    if (!seeds || seeds?.length === 0) {
      vscode.window.showInformationMessage(this.NO_SEEDS_MSG);
      return;
    }

    const items = seeds;
    const selected = vscode.window.showQuickPick(items).then((value) => {
      if (!value) {
        return;
      }
      return { seedId: value };
    });

    return selected;
  }

  async execute(_opts: CommandOpts): Promise<CommandOutput> {
    const seeds = await this.getSeedSvc().getSeedsInWorkspace();
    if (!seeds || seeds?.length === 0) {
      return {
        error: new DendronError({
          message: this.NO_SEEDS_MSG,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }

    const response = vscode.window
      .withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Removing Seed...",
          cancellable: false,
        },
        async () => {
          return this.getSeedSvc().removeSeed({
            id: _opts.seedId,
            onUpdatingWorkspace: this.onUpdatingWorkspace,
            onUpdatedWorkspace: this.onUpdatedWorkspace,
          });
        }
      )
      .then((resp) => {
        if (resp?.error) {
          vscode.window.showErrorMessage("Error: ", resp.error.message);
        }

        return resp;
      });

    return response;
  }
}
