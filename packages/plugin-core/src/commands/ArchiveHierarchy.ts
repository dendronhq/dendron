import { DNodeUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { RefactorHierarchyCommand } from "./RefactorHierarchy";
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
  private refactorCmd: RefactorHierarchyCommand | RefactorHierarchyCommandV2;

  constructor(name?: string) {
    super(name);
    if (DendronWorkspace.lsp()) {
      this.refactorCmd = new RefactorHierarchyCommandV2();
    } else {
      this.refactorCmd = new RefactorHierarchyCommand();
    }
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    let value = "";
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor) {
      value = DNodeUtils.uri2Fname(editor.document.uri);
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
