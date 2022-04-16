import { DendronError, ERROR_SEVERITY } from "@dendronhq/common-all";
import {
  SyncActionResult,
  SyncActionStatus,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { ProgressLocation, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { MessageSeverity, VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

const L = Logger;

type CommandOpts = {};
type CommandReturns =
  | {
      finalMessage: string;
      committed: SyncActionResult[];
    }
  | undefined;

export class AddAndCommit extends BasicCommand<CommandOpts, CommandReturns> {
  key = DENDRON_COMMANDS.ADD_AND_COMMIT.key;

  private static generateReportMessage({
    committed,
  }: {
    committed: SyncActionResult[];
  }) {
    const message = ["Finished Commit."];
    // Report anything unusual the user probably should know about
    let maxMessageSeverity: MessageSeverity = MessageSeverity.INFO;

    const makeMessage = (
      status: SyncActionStatus,
      results: SyncActionResult[][],
      fn: (repos: string) => {
        msg: string;
        severity: MessageSeverity;
      }
    ) => {
      const uniqResults = _.uniq(_.flattenDeep(results));
      const repos = WorkspaceUtils.getFilteredRepoNames(uniqResults, status);
      if (repos.length === 0) return;
      const { msg, severity } = fn(repos.join(", "));
      message.push(msg);
      if (severity > maxMessageSeverity) maxMessageSeverity = severity;
    };

    // Warnings, need user interaction to continue commit
    makeMessage(SyncActionStatus.MERGE_CONFLICT, [committed], (repos) => {
      return {
        msg: `Skipped ${repos} because they have merge conflicts that must be resolved manually.`,
        severity: MessageSeverity.WARN,
      };
    });

    makeMessage(SyncActionStatus.NO_CHANGES, [committed], (repos) => {
      return {
        msg: `Skipped ${repos} because it has no new changes.`,
        severity: MessageSeverity.INFO,
      };
    });

    makeMessage(SyncActionStatus.REBASE_IN_PROGRESS, [committed], (repos) => {
      return {
        msg: `Skipped ${repos} because there's a rebase in progress that must be resolved.`,
        severity: MessageSeverity.WARN,
      };
    });
    return { message, maxMessageSeverity };
  }

  async execute(opts?: CommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });
    const engine = ExtensionProvider.getEngine();
    const workspaceService = ExtensionProvider.getExtension().workspaceService;
    if (_.isUndefined(workspaceService))
      throw new DendronError({
        message: "Workspace is not initialized",
        severity: ERROR_SEVERITY.FATAL,
      });
    const committed = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Workspace Add and Commit",
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: "staging changes" });
        const committed = await workspaceService.commitAndAddAll({
          engine,
        });
        L.info(committed);
        return committed;
      }
    );
    const { message, maxMessageSeverity } = AddAndCommit.generateReportMessage({
      committed,
    });
    const committedDone = WorkspaceUtils.getCountForStatusDone(committed);
    const repos = (count: number) => (count <= 1 ? "repo" : "repos");
    message.push(`Committed ${committedDone} ${repos(committedDone)}`);
    const finalMessage = message.join(" ");
    VSCodeUtils.showMessage(maxMessageSeverity, finalMessage, {});
    return { committed, finalMessage };
  }
}
