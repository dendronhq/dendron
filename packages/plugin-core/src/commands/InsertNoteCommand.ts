import { ErrorFactory, NoteQuickInput } from "@dendronhq/common-all";
import { HistoryService, DConfig } from "@dendronhq/engine-server";
import _ from "lodash";
import { Selection, SnippetString } from "vscode";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import { NoteLookupProvider } from "../components/lookup/LookupProviderV3";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandInput = any;

type CommandOpts = {
  picks: NoteQuickInput[];
};

type CommandOutput = {};

export class InsertNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.INSERT_NOTE.key;

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  createLookup() {
    const lc = new LookupControllerV3({ nodeType: "note", buttons: [] });
    return lc;
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const lc = this.createLookup();
    const provider = new NoteLookupProvider("insert", { allowNewNote: false });
    const config = getDWorkspace().config;
    const tempPrefix = DConfig.getConfig({
      config,
      path: "commands.insertNote.initialValue",
    });
    const initialValue = tempPrefix ? `${tempPrefix}.` : undefined;
    lc.show({
      title: "Insert note",
      placeholder: "foo",
      provider,
      initialValue,
    });
    return new Promise((resolve) => {
      HistoryService.instance().subscribev2("lookupProvider", {
        id: "insert",
        listener: async (event) => {
          if (event.action === "done") {
            HistoryService.instance().remove("insert", "lookupProvider");
            resolve({ picks: event.data.selectedItems });
          } else if (event.action === "error") {
            return;
          } else {
            throw ErrorFactory.createUnexpectedEventError({ event });
          }
        },
      });
    });
  }

  async execute(opts: CommandOpts) {
    const ctx = "InsertNoteCommand";
    opts = _.defaults(opts, { closeAndOpenFile: true });
    Logger.info({ ctx, opts });
    const templates = opts.picks.map((pick) => {
      return pick.body;
    });
    const txt = templates.join("\n");
    const snippet = new SnippetString(txt);
    const editor = VSCodeUtils.getActiveTextEditor()!;
    const pos = editor.selection.active;
    const selection = new Selection(pos, pos);
    await editor.insertSnippet(snippet, selection);
    return txt;
  }
}
