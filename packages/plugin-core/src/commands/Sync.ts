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
    await getWS().workspaceService!.commidAndAddAll();
    // await getWS().workspaceService!.pullAndPush();
    window.showInformationMessage("finish sync");
    return;
  }
}
