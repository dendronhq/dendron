import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import { DConfig, HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { MultiSelectBtn } from "../components/lookup/buttons";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import {
  NoteLookupProvider,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";
import { getWS } from "../workspace"

type CommandInput = {
  multiSelect?: boolean;
  aliasMode?: InsertNoteLinkAliasMode;
};

type CommandOpts = {
  notes: readonly NoteProps[];
} & CommandInput;
type CommandOutput = CommandOpts;

export type InsertNoteLinkAliasMode = "snippet" | "selection" | "title" | "prompt" | "none";

export class InsertNoteLinkCommand extends BasicCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  key = DENDRON_COMMANDS.INSERT_NOTE_LINK.key;

  async gatherInputs(opts: CommandInput): Promise<CommandOpts | undefined> {
    const aliasModeConfig: InsertNoteLinkAliasMode | undefined = DConfig.getProp(
      getWS().config,
      "insertNoteLink"
    )?.aliasMode;
    const copts: CommandInput = _.defaults(opts || {}, {
      multiSelect: false,
      aliasMode: aliasModeConfig || "title",
    });
    const lc = LookupControllerV3.create({
      nodeType: "note",
      disableVaultSelection: true,
      extraButtons: [
        MultiSelectBtn.create(copts.multiSelect)
      ]
    });
    const provider = new NoteLookupProvider(this.key, {
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
        id: this.key,
        listener: async (event) => {
          if (event.action === "done") {
            HistoryService.instance().remove(this.key, "lookupProvider");
            const cdata = event.data as NoteLookupProviderSuccessResp;
            resolve({ notes: cdata.selectedItems, ...copts });
            lc.onHide();
          } else if (event.action === "error") {
            this.L.error({ msg: `error: ${event.data}` });
            resolve(undefined);
          } else if (event.action === "changeState") {
            this.L.info({ msg: "cancelled" });
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

    const editor = VSCodeUtils.getActiveTextEditor();
    if (!editor) {
      vscode.window.showErrorMessage(
        "You need to have a note open to insert note links."
      );
      return opts;
    }

    let links: string[] = [];
    switch(opts.aliasMode) {
      case "snippet": {
        links = opts.notes.map((note, index) => {
          return NoteUtils.createWikiLink({ note, aliasMode: "snippet", tabStopIndex: index+1 }); 
        });
        break;
      }
      case "selection": {
        let maybeAliasValue = "";
        const { range } = await VSCodeUtils.extractRangeFromActiveEditor() || {};
        const { text } = VSCodeUtils.getSelection();

        maybeAliasValue = text!;
        if (!_.isUndefined(range)) {
          await VSCodeUtils.deleteRange(editor.document, range as vscode.Range);
        } else {
          console.log({mode: opts.aliasMode})
          vscode.window.showWarningMessage("Selection doesn't contain any text. Ignoring aliases.")
        }
        links = opts.notes.map((note) => {
          return NoteUtils.createWikiLink({ note, aliasMode: "value", aliasValue: maybeAliasValue });
        });
        break;
      }
      case "prompt": {
        for (const note of opts.notes) {
          // eslint-disable-next-line no-await-in-loop
          const value = await VSCodeUtils.showInputBox({
            prompt: `Alias for note link of ${note.fname}. Leave blank to skip aliasing.`,
            ignoreFocusOut: true,
            placeHolder: "alias",
            title: "Type alias",
            value: note.title,
          });
          if (value !== "") {
            links.push(NoteUtils.createWikiLink({ note, aliasMode: "value", aliasValue: value}));
          } else {
            links.push(NoteUtils.createWikiLink({ note, aliasMode: "none" }));
          }
        }
        break;
      }
      case "none": {
        links = opts.notes.map((note) => {
          return NoteUtils.createWikiLink({ note, aliasMode: "none"});
        })
        break;
      }
      case "title": 
      default: {
        links = opts.notes.map((note) => {
          return NoteUtils.createWikiLink({ note, aliasMode: "title" });
        });
      }
    }

    const current = editor.selection;
    if (opts.aliasMode === "snippet") {
      const snippet = new vscode.SnippetString(links.join("\n"));
      await editor.insertSnippet(snippet, current);
    } else {
      await editor.edit((builder) => {
        builder.insert(current.start, links.join("\n"));
      });
    }
    return opts;
  }
}
