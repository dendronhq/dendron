import { DendronError, ERROR_SEVERITY } from "@dendronhq/common-all";
import { SyncActionResult, SyncActionStatus } from "@dendronhq/engine-server";
import _ from "lodash";
import { ProgressLocation, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { BasicCommand } from "./base";

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
    const workspaceService = ExtensionProvider.getExtension().workspaceService;
    if (_.isUndefined(workspaceService))
      throw new DendronError({
        message: "Workspace is not initialized",
        severity: ERROR_SEVERITY.FATAL,
      });
    const engine = ExtensionProvider.getEngine();

    const { committed, pulled, pushed } = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Syncing Workspace",
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0, message: "committing repos" });
        const committed = await workspaceService.commitAndAddAll({ engine });
        L.info(committed);
        progress.report({ increment: 25, message: "pulling repos" });
        const pulled = await workspaceService.pullVaults();
        L.info(pulled);
        progress.report({ increment: 50, message: "pushing repos" });

        const pushed = await workspaceService.pushVaults();
        progress.report({ increment: 100 });
        L.info(pushed);

        return { committed, pulled, pushed };
      }
    );

    const message = ["Finished sync."];

    // Report anything unusual the user probably should know about
    const unpulled = SyncCommand.filteredRepoNames(
      committed,
      SyncActionStatus.CANT_STASH
    ).join(", ");
    if (unpulled.length > 0) {
      message.push(
        `Skipped pulling repos ${unpulled} because they have uncommitted changes, and we failed to stash them.`
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
