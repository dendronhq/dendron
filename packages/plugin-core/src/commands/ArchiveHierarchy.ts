import { NoteUtilsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";
import { RefactorHierarchyCommandV2 } from "./RefactorHierarchyV2";

type CommandOpts = {
  match: string;
};

type CommandInput = {
  match: string;
};

type CommandOutput = any;

export class ArchiveHierarchyCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  private refactorCmd: RefactorHierarchyCommandV2;

  constructor(name?: string) {
    super(name);
    this.refactorCmd = new RefactorHierarchyCommandV2();
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    let value = "";
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor) {
      value = NoteUtilsV2.uri2Fname(editor.document.uri);
    }
    let match = await VSCodeUtils.showInputBox({
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
    return this.refactorCmd.execute({ match, replace });
  }

  async showResponse(res: CommandOutput) {
    return this.refactorCmd.showResponse(res);
  }
}
