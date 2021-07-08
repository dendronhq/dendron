import _ from "lodash";
import { ERROR_SEVERITY, DendronError } from "@dendronhq/common-all";

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
  key = DENDRON_COMMANDS.SYNC.key;

  static countDone(results: SyncActionResult[]): number {
    return results.filter((result) => result.status === SyncActionStatus.DONE)
      .length;
  }

  static filteredRepoNames(
    results: SyncActionResult[],
    status: SyncActionStatus
  ): string[] {
    const matchingResults = results.filter(
      (result) => result.status === status
    );
    if (matchingResults.length === 0) return [];
    return matchingResults.map((result) => result.repo);
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
    const uncommitted = SyncCommand.filteredRepoNames(
      committed,
      SyncActionStatus.UNCOMMITTED_CHANGES
    ).join(", ");
    if (uncommitted.length > 0) {
      message.push(
        `Skipped pulling repos ${uncommitted} because they have uncommitted changes.`
      );
    }
    const noUpstream = _.uniq([
      ...SyncCommand.filteredRepoNames(pushed, SyncActionStatus.NO_UPSTREAM),
      ...SyncCommand.filteredRepoNames(pulled, SyncActionStatus.NO_UPSTREAM),
    ]).join(", ");
    if (noUpstream.length > 0) {
      message.push(
        `Skipped pulling or pushing repos ${noUpstream} because they don't have upstream branches configured.`
      );
    }

    const committedDone = SyncCommand.countDone(committed);
    const pulledDone = SyncCommand.countDone(pulled);
    const pushedDone = SyncCommand.countDone(pushed);
    const repos = (count: number) => (count === 1 ? "repo" : "repos");
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
