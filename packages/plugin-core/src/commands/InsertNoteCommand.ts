import { ConfigUtils, NoteQuickInput } from "@dendronhq/common-all";
import { HistoryEvent } from "@dendronhq/engine-server";
import _ from "lodash";
import { Selection, SnippetString } from "vscode";
import { NoteLookupProviderUtils } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import { ExtensionProvider } from "../ExtensionProvider";

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
    const lc = ExtensionProvider.getExtension().lookupControllerFactory.create({
      nodeType: "note",
      buttons: [],
    });
    return lc;
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const lc = this.createLookup();
    const extension = ExtensionProvider.getExtension();
    const provider = extension.noteLookupProviderFactory.create("insert", {
      allowNewNote: false,
    });
    const config = extension.getDWorkspace().config;
    const tempPrefix = ConfigUtils.getCommands(config).insertNote.initialValue;
    const initialValue = tempPrefix ? `${tempPrefix}.` : undefined;

    return new Promise((resolve) => {
      NoteLookupProviderUtils.subscribe({
        id: "insert",
        controller: lc,
        logger: this.L,
        onDone: (event: HistoryEvent) => {
          resolve({ picks: event.data.selectedItems });
        },
      });
      lc.show({
        title: "Insert note",
        placeholder: "foo",
        provider,
        initialValue,
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
