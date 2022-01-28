import {
  assertUnreachable,
  DendronError,
  ERROR_SEVERITY,
  VaultUtils,
} from "@dendronhq/common-all";
import { SyncActionResult, SyncActionStatus } from "@dendronhq/engine-server";
import _ from "lodash";
import { ProgressLocation, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { BasicCommand } from "./base";

enum Severity {
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

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

  private static filteredRepoNames(
    results: SyncActionResult[],
    status: SyncActionStatus
  ): string[] {
    const matchingResults = results.filter(
      (result) => result.status === status
    );
    if (matchingResults.length === 0) return [];
    return matchingResults.map((result) => {
      // Display the vault names for info/error messages
      if (result.vaults.length === 1) {
        return VaultUtils.getName(result.vaults[0]);
      }
      // But if there's more than one vault in the repo, then use the repo path which is easier to interpret
      return result.repo;
    });
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
    let maxSeverity: Severity = Severity.INFO;
    const makeMessage = (
      status: SyncActionStatus,
      results: SyncActionResult[][],
      fn: (repos: string) => {
        msg: string;
        severity: Severity;
      }
    ) => {
      const uniqResults = _.uniq(_.flattenDeep(results));
      const repos = SyncCommand.filteredRepoNames(uniqResults, status);
      if (repos.length === 0) return;
      const { msg, severity } = fn(repos.join(", "));
      message.push(msg);
      if (severity > maxSeverity) maxSeverity = severity;
    };

    // Errors, sync is probably misconfigured or there's something wrong with git
    makeMessage(SyncActionStatus.CANT_STASH, [pulled], (repos) => {
      return {
        msg: `Can't pull ${repos} because there are local changes that can't be stashed.`,
        severity: Severity.ERROR,
      };
    });
    makeMessage(SyncActionStatus.NOT_PERMITTED, [pushed], (repos) => {
      return {
        msg: `Can't pull ${repos} because this user is not permitted.`,
        severity: Severity.ERROR,
      };
    });
    // Warnings, need user interaction to continue sync
    makeMessage(SyncActionStatus.MERGE_CONFLICT, [pulled], (repos) => {
      return {
        msg: `Can't pull ${repos} because they have merge conflicts that must be resolved manually.`,
        severity: Severity.WARN,
      };
    });
    makeMessage(
      SyncActionStatus.MERGE_CONFLICT_AFTER_PULL,
      [pulled],
      (repos) => {
        return {
          msg: `Pulled ${repos} but they have merge conflicts that must be resolved.`,
          severity: Severity.WARN,
        };
      }
    );
    makeMessage(
      SyncActionStatus.MERGE_CONFLICT_LOSES_CHANGES,
      [pulled],
      (repos) => {
        return {
          msg: `Can't pull ${repos} because there are local changes, and pulling will cause a merge conflict. You must commit your local changes first.`,
          severity: Severity.WARN,
        };
      }
    );
    makeMessage(SyncActionStatus.REBASE_IN_PROGRESS, [pulled], (repos) => {
      return {
        msg: `Can't pull ${repos} because there's a rebase in progress that must be resolved.`,
        severity: Severity.WARN,
      };
    });
    makeMessage(SyncActionStatus.NO_UPSTREAM, [pulled, pushed], (repos) => {
      return {
        msg: `Skipped pulling or pushing ${repos} because they don't have upstream branches configured.`,
        severity: Severity.WARN,
      };
    });

    // Successful operations
    const committedDone = SyncCommand.countDone(committed);
    const pulledDone = SyncCommand.countDone(pulled);
    const pushedDone = SyncCommand.countDone(pushed);
    const repos = (count: number) => (count === 1 ? "repo" : "repos");
    message.push(`Committed ${committedDone} ${repos(committedDone)},`);
    message.push(`tried pulling ${pulledDone}`);
    message.push(`and pushing ${pushedDone} ${repos(pushedDone)}.`);
    const finalMessage = message.join(" ");

    // Typescript thinks `maxSeverity` can only be `INFO` if I use a switch here for some reason. The if chain typechecks correctly.
    if (maxSeverity === Severity.INFO) {
      window.showInformationMessage(finalMessage);
    } else if (maxSeverity === Severity.WARN) {
      window.showWarningMessage(finalMessage);
    } else if (maxSeverity === Severity.ERROR) {
      window.showErrorMessage(finalMessage);
    } else {
      assertUnreachable(maxSeverity);
    }

    return {
      committed,
      pulled,
      pushed,
    };
  }
}
