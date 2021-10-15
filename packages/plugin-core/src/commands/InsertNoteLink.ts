import {
  LegacyInsertNoteLinkAliasMode,
  NoteProps,
  NoteUtils,
} from "@dendronhq/common-all";
import { HistoryService, DConfig } from "@dendronhq/engine-server";
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
import { getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandInput = {
  multiSelect?: boolean;
  aliasMode?: keyof typeof LegacyInsertNoteLinkAliasMode;
};

type CommandOpts = {
  notes: readonly NoteProps[];
} & CommandInput;
type CommandOutput = CommandOpts;

export class InsertNoteLinkCommand extends BasicCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  key = DENDRON_COMMANDS.INSERT_NOTE_LINK.key;

  async gatherInputs(opts: CommandInput): Promise<CommandOpts | undefined> {
    const config = getDWorkspace().config;
    const insertNoteLinkConfig = DConfig.getConfig({
      config,
      path: "commands.insertNoteLink",
      required: true,
    });
    const aliasModeConfig = insertNoteLinkConfig?.aliasMode;
    let multiSelectConfig;
    if (!_.isUndefined(insertNoteLinkConfig)) {
      multiSelectConfig =
        "multiSelect" in insertNoteLinkConfig
          ? insertNoteLinkConfig.multiSelect
          : insertNoteLinkConfig?.enableMultiSelect;
    }

    const copts: CommandInput = _.defaults(opts || {}, {
      multiSelect: multiSelectConfig || false,
      aliasMode: aliasModeConfig || "none",
    });
    const lc = LookupControllerV3.create({
      nodeType: "note",
      disableVaultSelection: true,
      extraButtons: [MultiSelectBtn.create(copts.multiSelect)],
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

  async promptForAlias(note: NoteProps) {
    const value = await VSCodeUtils.showInputBox({
      prompt: `Alias for note link of ${note.fname}. Leave blank to skip aliasing.`,
      ignoreFocusOut: true,
      placeHolder: "alias",
      title: "Type alias",
      value: note.title,
    });
    return value;
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
    switch (opts.aliasMode) {
      case "snippet": {
        links = opts.notes.map((note, index) => {
          return NoteUtils.createWikiLink({
            note,
            alias: { mode: "snippet", tabStopIndex: index + 1 },
          });
        });
        break;
      }
      case "selection": {
        let maybeAliasValue = "";
        const { range } =
          (await VSCodeUtils.extractRangeFromActiveEditor()) || {};
        const { text } = VSCodeUtils.getSelection();

        maybeAliasValue = text!;
        if (!_.isUndefined(range)) {
          await VSCodeUtils.deleteRange(editor.document, range as vscode.Range);
        } else {
          vscode.window.showWarningMessage(
            "Selection doesn't contain any text. Ignoring aliases."
          );
        }
        links = opts.notes.map((note) => {
          return NoteUtils.createWikiLink({
            note,
            alias: { mode: "value", value: maybeAliasValue },
          });
        });
        break;
      }
      case "prompt": {
        for (const note of opts.notes) {
          // eslint-disable-next-line no-await-in-loop
          const value = await this.promptForAlias(note);
          if (value !== "") {
            links.push(
              NoteUtils.createWikiLink({
                note,
                alias: { mode: "value", value },
              })
            );
          } else {
            links.push(
              NoteUtils.createWikiLink({ note, alias: { mode: "none" } })
            );
          }
        }
        break;
      }
      case "title": {
        links = opts.notes.map((note) => {
          return NoteUtils.createWikiLink({ note, alias: { mode: "title" } });
        });
        break;
      }
      case "none":
      default: {
        links = opts.notes.map((note) => {
          return NoteUtils.createWikiLink({ note, alias: { mode: "none" } });
        });
        break;
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
