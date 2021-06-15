import _ from "lodash";
import { ERROR_SEVERITY } from "@dendronhq/common-all";
import { DendronError } from "@dendronhq/common-all";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { getWS } from "../workspace";
import { BasicCommand } from "./base";
import { SyncActionResult, SyncActionStatus } from "@dendronhq/engine-server";
const L = Logger;

type CommandOpts = {};
type CommandReturns =
  | {
      committed: SyncActionResult[];
      pulled: SyncActionResult[];
      pushed: SyncActionResult[];
    }
  | undefined;

export class SyncCommand extends BasicCommand<CommandOpts, CommandReturns> {
  static key = DENDRON_COMMANDS.SYNC.key;

  static countDone(results: SyncActionResult[]): number {
    return results.filter((result) => result.status === SyncActionStatus.DONE)
      .length;
  }

  static filteredReponames(
    results: SyncActionResult[],
    status: SyncActionStatus
  ): string | undefined {
    const matchingResults = results.filter(
      (result) => result.status === status
    );
    if (matchingResults.length == 0) return undefined;
    return matchingResults.map((result) => result.repo).join(", ");
  }

  async execute(opts?: CommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });
    const workspaceService = getWS().workspaceService;
    if (_.isUndefined(workspaceService))
      throw new DendronError({
        message: "Workspace is not initialized",
        severity: ERROR_SEVERITY.FATAL,
      });

    const committed = await workspaceService.commitAndAddAll();
    L.info(committed);

    const pulled = await workspaceService.pullVaults();
    L.info(pulled);

    const pushed = await workspaceService.pushVaults();
    L.info(pushed);

    const message = ["Finished sync."];

    // Report anything unusual the user probably should know about
    const uncommitted = SyncCommand.filteredReponames(
      committed,
      SyncActionStatus.UNCOMMITTED_CHANGES
    );
    if (!_.isUndefined(uncommitted)) {
      message.push(
        `Skipped pulling repos ${uncommitted} because they had uncommitted changes.`
      );
    }
    const noPushRemote = SyncCommand.filteredReponames(
      pushed,
      SyncActionStatus.NO_PUSH_REMOTE
    );
    if (!_.isUndefined(noPushRemote)) {
      message.push(
        `Skipped pushing repos ${noPushRemote} because they don't have upstream branches configured.`
      );
    }

    const committedDone = SyncCommand.countDone(committed);
    const pulledDone = SyncCommand.countDone(pulled);
    const pushedDone = SyncCommand.countDone(pushed);
    const repos = (count: number) => (count == 1 ? "repo" : "repos");
    message.push(`Committed ${committedDone} ${repos(committedDone)},`);
    message.push(`tried pulling ${pulledDone}`);
    message.push(`and pushing ${pushedDone} ${repos(pushedDone)}.`);

    window.showInformationMessage(message.join(" "));
    return {
      committed,
      pulled,
      pushed,
    };
  }
}
