import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import { HistoryService } from "@dendronhq/engine-server";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import {
  NoteLookupProvider,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";

type CommandInput = {};

type CommandOpts = {
  notes: readonly NoteProps[];
};
type CommandOutput = CommandOpts;

export class InsertNoteLinkCommand extends BasicCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  static key = DENDRON_COMMANDS.INSERT_NOTE_LINK.key;

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const lc = LookupControllerV3.create({
      disableVaultSelection: true,
    });
    const provider = new NoteLookupProvider(InsertNoteLinkCommand.key, {
      allowNewNote: false,
      noHidePickerOnAccept: false,
    });
    lc.show({
      title: "Select note to link to",
      placeholder: "note",
      provider,
    });

    return new Promise((resolve) => {
      HistoryService.instance().subscribev2("lookupProvider", {
        id: InsertNoteLinkCommand.key,
        listener: async (event) => {
          if (event.action === "done") {
            HistoryService.instance().remove(
              InsertNoteLinkCommand.key,
              "lookupProvider"
            );
            const cdata = event.data as NoteLookupProviderSuccessResp;
            resolve({ notes: cdata.selectedItems });
            lc.onHide();
          } else if (event.action === "error") {
            this.L.error({ msg: `error: ${event.data}` });
            resolve(undefined);
          } else {
            this.L.error({ msg: `unhandled error: ${event.data}` });
            resolve(undefined);
          }
        },
      });
    });
  }

  async execute(opts: CommandOpts) {
    const ctx = "InsertNoteLinkCommand";
    this.L.info({ ctx, notes: opts.notes.map((n) => NoteUtils.toLogObj(n)) });
    const links: string[] = opts.notes.map((note) => {
      return NoteUtils.createWikiLink({ note, useTitle: false });
    });
    const editor = VSCodeUtils.getActiveTextEditor()!;
    let current = editor.selection;
    await editor.edit((builder) => {
      builder.insert(current.start, links.join("\n"));
    });
    return opts;
  }
}
