import {
  getSlugger,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { QuickInputButton, ThemeIcon } from "vscode";
import { NoteSyncService } from "../../services/NoteSyncService";
import { clipboard, DendronClientUtilsV2, VSCodeUtils } from "../../utils";
import { getExtension } from "../../workspace";
import {
  DendronQuickPickerV2,
  LookupEffectType,
  LookupFilterType,
  LookupNoteType,
  LookupNoteTypeEnum,
  LookupSelectionType,
  LookupSplitType,
  VaultSelectionMode,
} from "./types";
import { NotePickerUtils, PickerUtilsV2 } from "./utils";

export type ButtonType =
  | LookupEffectType
  | LookupNoteType
  | LookupSelectionType
  | LookupSplitType
  | LookupFilterType
  | "other";

export type ButtonCategory =
  | "selection"
  | "note"
  | "split"
  | "filter"
  | "effect"
  | "other";

export type ButtonHandleOpts = { quickPick: DendronQuickPickerV2 };

export function getButtonCategory(button: DendronBtn): ButtonCategory {
  if (isSelectionBtn(button)) {
    return "selection";
  }
  if (isNoteBtn(button)) {
    return "note";
  }
  if (isSplitButton(button)) {
    return "split";
  }
  if (isFilterButton(button)) {
    return "filter";
  }
  if (isEffectButton(button)) {
    return "effect";
  }
  if (button.type === "other") {
    return "other";
  }
  throw Error(`unknown btn type ${button}`);
}

function isEffectButton(button: DendronBtn) {
  return _.includes(
    ["copyNoteLink", "copyNoteRef", "multiSelect"],
    button.type
  );
}
function isFilterButton(button: DendronBtn) {
  return _.includes(["directChildOnly"], button.type);
}

function isSelectionBtn(button: DendronBtn) {
  return _.includes(["selection2link", "selectionExtract"], button.type);
}

function isNoteBtn(button: DendronBtn) {
  return _.includes(["journal", "scratch"], button.type);
}

function isSplitButton(button: DendronBtn) {
  return _.includes(["horizontal", "vertical"], button.type);
}

const selectionToNoteProps = async (opts: {
  selectionType: string;
  note: NoteProps;
}) => {
  const ext = getExtension();
  const resp = await VSCodeUtils.extractRangeFromActiveEditor();
  const { document, range } = resp || {};
  const { selectionType, note } = opts;
  const { selection, text } = VSCodeUtils.getSelection();

  switch (selectionType) {
    case "selectionExtract": {
      if (!_.isUndefined(document)) {
        const body = "\n" + document.getText(range).trim();
        note.body = body;
        // don't delete if original file is not in workspace
        if (!ext.workspaceService?.isPathInWorkspace(document.uri.fsPath)) {
          return note;
        }
        await VSCodeUtils.deleteRange(document, range as vscode.Range);
      }
      return note;
    }
    case "selection2link": {
      if (!_.isUndefined(document)) {
        const editor = VSCodeUtils.getActiveTextEditor();
        if (editor) {
          await editor.edit((builder) => {
            const link = note.fname;
            if (!_.isUndefined(selection) && !selection.isEmpty) {
              builder.replace(selection, `[[${text}|${link}]]`);
            }
          });
          // Because the window switches too quickly, note sync service
          // sometimes can't update the current note with the link fast enough.
          // So we manually force the update here instead.

          const currentNote = VSCodeUtils.getNoteFromDocument(editor.document);
          if (currentNote) {
            await NoteSyncService.instance().updateNoteContents({
              oldNote: currentNote,
              content: editor.document.getText(),
              fmChangeOnly: false,
              fname: currentNote.fname,
              vault: currentNote.vault,
            });
          }
        }
      }
      return note;
    }
    default: {
      return note;
    }
  }
};

export type IDendronQuickInputButton = QuickInputButton & {
  type: ButtonType;
  pressed: boolean;
  onLookup: (payload: any) => Promise<void>;
};

type DendronBtnCons = {
  title: string;
  iconOff: string;
  iconOn: string;
  type: ButtonType;
  pressed?: boolean;
  canToggle?: boolean;
};
export class DendronBtn implements IDendronQuickInputButton {
  public iconPathNormal: ThemeIcon;
  public iconPathPressed: ThemeIcon;
  public type: ButtonType;
  public pressed: boolean;
  public canToggle: boolean;
  public title: string;
  public opts: DendronBtnCons;

  onLookup = async (_payload: any) => {
    return;
  };

  constructor(opts: DendronBtnCons) {
    const { iconOff, iconOn, type, title, pressed } = opts;
    this.iconPathNormal = new vscode.ThemeIcon(iconOff);
    this.iconPathPressed = new vscode.ThemeIcon(iconOn);
    this.type = type;
    this.pressed = pressed || false;
    this.title = title;
    this.canToggle = _.isUndefined(opts.canToggle) ? true : opts.canToggle;
    this.opts = opts;
  }

  clone(): DendronBtn {
    return new DendronBtn({
      ...this.opts,
    });
  }

  async onEnable(_opts: ButtonHandleOpts): Promise<void> {
    return undefined;
  }

  async onDisable(_opts: ButtonHandleOpts): Promise<void> {
    return undefined;
  }

  get iconPath() {
    return !this.pressed ? this.iconPathNormal : this.iconPathPressed;
  }

  get tooltip(): string {
    return `${this.title}, status: ${this.pressed ? "on" : "off"}`;
  }

  toggle() {
    if (this.canToggle) {
      this.pressed = !this.pressed;
    }
  }
}

export class Selection2LinkBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new Selection2LinkBtn({
      title: "Selection to Link",
      iconOff: "link",
      iconOn: "menu-selection",
      type: "selection2link",
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.selectionProcessFunc = (note: NoteProps) => {
      return selectionToNoteProps({
        selectionType: "selection2link",
        note,
      });
    };

    quickPick.prevValue = quickPick.value;
    const { text } = VSCodeUtils.getSelection();
    const slugger = getSlugger();
    quickPick.selectionModifierValue = slugger.slug(text!);
    if (quickPick.noteModifierValue || quickPick.prefix) {
      quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    } else {
      quickPick.value = [
        quickPick.rawValue,
        NotePickerUtils.getPickerValue(quickPick),
      ].join(".");
    }
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.selectionProcessFunc = undefined;
    quickPick.selectionModifierValue = undefined;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    return;
  }
}

export class SelectionExtractBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new SelectionExtractBtn({
      title: "Selection Extract",
      iconOff: "find-selection",
      iconOn: "menu-selection",
      type: "selectionExtract",
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.selectionProcessFunc = (note: NoteProps) => {
      return selectionToNoteProps({
        selectionType: "selectionExtract",
        note,
      });
    };
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.selectionProcessFunc = undefined;
    return;
  }
}

export class JournalBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new JournalBtn({
      title: "Create Journal Note",
      iconOff: "calendar",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.journal,
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = () => {
      return DendronClientUtilsV2.genNoteName("JOURNAL");
    };
    const { noteName, prefix } = quickPick.modifyPickerValueFunc();
    quickPick.noteModifierValue = _.difference(
      noteName.split("."),
      prefix.split(".")
    ).join(".");
    quickPick.prevValue = quickPick.value;
    quickPick.prefix = prefix;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = undefined;
    quickPick.noteModifierValue = undefined;
    quickPick.prevValue = quickPick.value;
    quickPick.prefix = quickPick.rawValue;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
  }
}

export class ScratchBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new ScratchBtn({
      title: "Create Scratch Note",
      iconOff: "new-file",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.scratch,
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = () => {
      return DendronClientUtilsV2.genNoteName("SCRATCH");
    };
    quickPick.prevValue = quickPick.value;
    const { noteName, prefix } = quickPick.modifyPickerValueFunc();
    quickPick.noteModifierValue = _.difference(
      noteName.split("."),
      prefix.split(".")
    ).join(".");
    quickPick.prefix = prefix;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = undefined;
    quickPick.noteModifierValue = undefined;
    quickPick.prevValue = quickPick.value;
    quickPick.prefix = quickPick.rawValue;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
  }
}
export class HorizontalSplitBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new HorizontalSplitBtn({
      title: "Split Horizontal",
      iconOff: "split-horizontal",
      iconOn: "menu-selection",
      type: "horizontal",
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.showNote = async (uri) =>
      vscode.window.showTextDocument(uri, {
        viewColumn: vscode.ViewColumn.Beside,
      });
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.showNote = async (uri) => vscode.window.showTextDocument(uri);
    return;
  }
}

export class DirectChildFilterBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new DirectChildFilterBtn({
      title: "Direct Child Filter",
      iconOff: "git-branch",
      iconOn: "menu-selection",
      type: "directChildOnly" as LookupFilterType,
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.showDirectChildrenOnly = true;
    quickPick.filterMiddleware = (items: NoteQuickInput[]) => items;
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.showDirectChildrenOnly = false;
    quickPick.filterMiddleware = undefined;
    return;
  }
}

export class MultiSelectBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new MultiSelectBtn({
      title: "Multi-Select",
      iconOff: "chrome-maximize",
      iconOn: "menu-selection",
      type: "multiSelect" as LookupEffectType,
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.canSelectMany = this.pressed;
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.canSelectMany = this.pressed;
  }
}

export class CopyNoteLinkBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new CopyNoteLinkBtn({
      title: "Copy Note Link",
      iconOff: "clippy",
      iconOn: "menu-selection",
      type: "copyNoteLink" as LookupEffectType,
      pressed,
      // Setting this to TRUE to retain any previous behavior. Previously DendronBtn
      // would always overwrite the canToggle to TRUE. Even though this code branch
      // used to set it to FALSE.
      canToggle: true,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.copyNoteLinkFunc = async (items: NoteProps[]) => {
      const links = items.map((note) =>
        NoteUtils.createWikiLink({ note, alias: { mode: "title" } })
      );
      if (_.isEmpty(links)) {
        vscode.window.showInformationMessage(`no items selected`);
      } else {
        await clipboard.writeText(links.join("\n"));
        vscode.window.showInformationMessage(`${links.length} links copied`);
      }
    };
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.copyNoteLinkFunc = undefined;
  }
}

export class VaultSelectButton extends DendronBtn {
  static create(opts: { pressed?: boolean; canToggle?: boolean }) {
    return new VaultSelectButton({
      title: "Select Vault",
      iconOff: "package",
      iconOn: "menu-selection",
      type: "other" as LookupEffectType,
      pressed: opts.pressed,
      canToggle: opts.canToggle,
    });
  }

  get tooltip(): string {
    return `${this.title}, status: ${this.pressed ? "always prompt" : "smart"}`;
  }

  setNextPicker({
    quickPick,
    mode,
  }: {
    quickPick: DendronQuickPickerV2;
    mode: VaultSelectionMode;
  }) {
    quickPick.nextPicker = async (opts: { note: NoteProps }) => {
      const { note } = opts;
      const currentVault = PickerUtilsV2.getVaultForOpenEditor();
      const vaultSelection = await PickerUtilsV2.getOrPromptVaultForNewNote({
        vault: currentVault,
        fname: note.fname,
        vaultSelectionMode: mode,
      });

      if (_.isUndefined(vaultSelection)) {
        vscode.window.showInformationMessage("Note creation cancelled.");
        return;
      }

      return vaultSelection;
    };
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    this.setNextPicker({ quickPick, mode: VaultSelectionMode.alwaysPrompt });
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    this.setNextPicker({ quickPick, mode: VaultSelectionMode.smart });
  }
}

export function createAllButtons(
  typesToTurnOn: ButtonType[] = []
): DendronBtn[] {
  const buttons = [
    MultiSelectBtn.create(),
    CopyNoteLinkBtn.create(),
    DirectChildFilterBtn.create(),
    SelectionExtractBtn.create(),
    Selection2LinkBtn.create(),
    JournalBtn.create(),
    ScratchBtn.create(),
    HorizontalSplitBtn.create(),
    // VerticalSplitBtn.create(),
  ];
  typesToTurnOn.map((btnType) => {
    (_.find(buttons, { type: btnType }) as DendronBtn).pressed = true;
  });
  return buttons;
}
