import _ from "lodash";
import { ERROR_SEVERITY } from "@dendronhq/common-all";
import { DendronError } from "@dendronhq/common-all";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { getWS } from "../workspace";
import { BasicCommand } from "./base";
const L = Logger;

type CommandOpts = {};

export class SyncCommand extends BasicCommand<CommandOpts, void> {
  static key = DENDRON_COMMANDS.SYNC.key;

  async execute(opts?: CommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });
    const workspaceService = getWS().workspaceService;
    if (_.isUndefined(workspaceService))
      throw new DendronError({
        message: "Workspace is not initialized",
        severity: ERROR_SEVERITY.FATAL,
      });

    const committed = await workspaceService.commidAndAddAll();
    L.info(`Committed changes in ${committed.length} vaults`);

    const pulled = await workspaceService.pullVaults();
    L.info(`Pulled changes for ${pulled.length} vaults`);

    const pushed = await workspaceService.pushVaults();
    L.info(`Pushed changes for ${pushed.length} vaults`);

    window.showInformationMessage("finish sync");
    return;
  }
}
