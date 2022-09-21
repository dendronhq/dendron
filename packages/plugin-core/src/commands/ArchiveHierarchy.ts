import {
  extractNoteChangeEntryCounts,
  NoteUtils,
  RefactoringCommandUsedPayload,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import {
  RefactorHierarchyCommandV2,
  CommandOutput as RefactorHierarchyV2CommandOutput,
} from "./RefactorHierarchyV2";

type CommandOpts = {
  match: string;
};

type CommandInput = {
  match: string;
};

type CommandOutput = RefactorHierarchyV2CommandOutput;

export class ArchiveHierarchyCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.ARCHIVE_HIERARCHY.key;
  private refactorCmd: RefactorHierarchyCommandV2;
  private trackProxyMetrics;
  private prepareProxyMetricPayload;
  _proxyMetricPayload:
    | (RefactoringCommandUsedPayload & {
        extra: {
          [key: string]: any;
        };
      })
    | undefined;

  constructor(name?: string) {
    super(name);
    this.refactorCmd = new RefactorHierarchyCommandV2();
    this.trackProxyMetrics = this.refactorCmd.trackProxyMetrics.bind(this);
    this.prepareProxyMetricPayload =
      this.refactorCmd.prepareProxyMetricPayload.bind(this);
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    let value = "";
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor) {
      value = NoteUtils.uri2Fname(editor.document.uri);
    }
    const match = await VSCodeUtils.showInputBox({
      prompt: "Enter hierarchy to archive",
      value,
    });
    if (!match) {
      return;
    }
    return { match };
  }
  async execute(opts: CommandOpts) {
    const { match } = _.defaults(opts, {});
    const replace = `archive.${match}`;
    const engine = ExtensionProvider.getEngine();
    const capturedNotes = await this.refactorCmd.getCapturedNotes({
      scope: undefined,
      matchRE: new RegExp(match),
      engine,
    });
    this.prepareProxyMetricPayload(capturedNotes);
    return this.refactorCmd.execute({ match, replace });
  }

  async showResponse(res: CommandOutput) {
    return this.refactorCmd.showResponse(res);
  }

  addAnalyticsPayload(_opts: CommandOpts, out: CommandOutput) {
    const noteChangeEntryCounts =
      out !== undefined
        ? { ...extractNoteChangeEntryCounts(out.changed) }
        : {
            createdCount: 0,
            updatedCount: 0,
            deletedCount: 0,
          };
    try {
      this.trackProxyMetrics({
        noteChangeEntryCounts,
      });
    } catch (error) {
      this.L.error({ error });
    }
    return noteChangeEntryCounts;
  }
}
