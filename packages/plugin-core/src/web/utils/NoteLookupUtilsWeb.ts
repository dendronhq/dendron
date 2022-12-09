import {
  assertUnreachable,
  ConfigUtils,
  DendronConfig,
  DNodeUtils,
  getSlugger,
  LookupNoteTypeEnum,
  NoteAddBehavior,
  NoteAddBehaviorEnum,
  NoteQuickInputV2,
  NoteUtils,
  Time,
} from "@dendronhq/common-all";
import _ from "lodash";
import { inject, injectable } from "tsyringe";
import { Utils } from "vscode-uri";
import { _noteAddBehaviorEnum } from "../../constants";
import * as vscode from "vscode";
import { DendronWebQuickPick } from "../../components/lookup/types";
import { ButtonType, DendronBtn } from "../../components/lookup/ButtonTypes";

type CreateFnameOverrides = {
  domain?: string;
};

type CreateFnameOpts = {
  overrides?: CreateFnameOverrides;
};

@injectable()
export class NoteLookupUtilsWeb {
  constructor(@inject("DendronConfig") private config: DendronConfig) {}
  genNoteName(
    type:
      | LookupNoteTypeEnum.journal
      | LookupNoteTypeEnum.scratch
      | LookupNoteTypeEnum.task,
    opts?: CreateFnameOpts
  ): {
    noteName: string;
    prefix: string;
  } {
    let dateFormat: string;
    let addBehavior: NoteAddBehavior;
    let name: string;

    switch (type) {
      case LookupNoteTypeEnum.scratch: {
        const scratchConfig = ConfigUtils.getScratch(this.config);
        dateFormat = scratchConfig.dateFormat;
        addBehavior = scratchConfig.addBehavior;
        name = scratchConfig.name;
        break;
      }
      case LookupNoteTypeEnum.journal: {
        const journalConfig = ConfigUtils.getJournal(this.config);
        dateFormat = journalConfig.dateFormat;
        addBehavior = journalConfig.addBehavior;
        name = journalConfig.name;
        break;
      }
      case LookupNoteTypeEnum.task: {
        const taskConfig = ConfigUtils.getTask(this.config);
        dateFormat = taskConfig.dateFormat;
        addBehavior = taskConfig.addBehavior;
        name = taskConfig.name;
        break;
      }
      default:
        assertUnreachable(type);
    }

    if (!_.includes(_noteAddBehaviorEnum, addBehavior)) {
      const actual = addBehavior;
      const choices = Object.keys(NoteAddBehaviorEnum).join(", ");
      throw Error(`${actual} must be one of: ${choices}`);
    }

    const editorPath = vscode.window.activeTextEditor?.document.uri;
    const currentNoteFname =
      opts?.overrides?.domain ||
      (editorPath ? Utils.basename(editorPath).slice(0, -3) : undefined);
    if (!currentNoteFname) {
      throw Error("Must be run from within a note");
    }

    const prefix = this.genNotePrefix(currentNoteFname, addBehavior);

    const noteDate = Time.now().toFormat(dateFormat);
    const noteName = [prefix, name, noteDate]
      .filter((ent) => !_.isEmpty(ent))
      .join(".");
    return { noteName, prefix };
  }

  private genNotePrefix(fname: string, addBehavior: NoteAddBehavior) {
    let out: string;
    switch (addBehavior) {
      case "childOfDomain": {
        out = DNodeUtils.domainName(fname);
        break;
      }
      case "childOfDomainNamespace": {
        out = NoteUtils.getPathUpTo(fname, 2);
        break;
      }
      case "childOfCurrent": {
        out = fname;
        break;
      }
      case "asOwnDomain": {
        out = "";
        break;
      }
      default: {
        throw Error(`unknown add Behavior: ${addBehavior}`);
      }
    }
    return out;
  }

  onJournalButtonToggled(
    enabled: boolean,
    qp: DendronWebQuickPick<NoteQuickInputV2>,
    initialValue: string = ""
  ) {
    if (enabled) {
      let data: { [key: string]: string };
      try {
        data = this.genNoteName(LookupNoteTypeEnum.journal);
      } catch (error) {
        data = { noteName: "", prefix: "" };
      }
      const noteModifierValue = _.difference(
        data.noteName.split("."),
        data.prefix.split(".")
      ).join(".");
      const text = this.getSelectedText();
      const slugger = getSlugger();
      const selectionModifierValue = text ? slugger.slug(text) : undefined;

      qp.value = this.generatePickerValue({
        prefix: data.prefix,
        noteModifierValue,
        selectionModifierValue,
      });
    } else {
      qp.value = this.generatePickerValue({
        prefix: initialValue,
        noteModifierValue: undefined,
        selectionModifierValue: undefined,
      });
    }
  }

  generatePickerValue({
    prefix,
    noteModifierValue,
    selectionModifierValue,
  }: {
    prefix: string;
    noteModifierValue?: string;
    selectionModifierValue?: string;
  }): string {
    return [prefix, noteModifierValue, selectionModifierValue]
      .filter((ent) => !_.isEmpty(ent))
      .join(".");
  }

  getSelectedText() {
    const editor = vscode.window.activeTextEditor;
    if (_.isUndefined(editor)) {
      return undefined;
    }
    const selection = editor.selection;
    return editor.document.getText(selection);
  }

  getButtonFromArray(type: ButtonType, buttons: DendronBtn[]) {
    return _.find(buttons, (value) => value.type === type);
  }
  getButton(type: ButtonType, buttons: DendronBtn[]): DendronBtn | undefined {
    return this.getButtonFromArray(type, buttons);
  }
}
