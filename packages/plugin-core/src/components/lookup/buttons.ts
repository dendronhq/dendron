import {
  ConfigUtils,
  getSlugger,
  MODIFIER_DESCRIPTIONS,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  TaskNoteUtils,
} from "@dendronhq/common-all";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { DendronClientUtilsV2 } from "../../clientUtils";
import { ExtensionProvider } from "../../ExtensionProvider";
import { clipboard } from "../../utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronBtn } from "./ButtonTypes";
import { NotePickerUtils } from "./NotePickerUtils";
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
import { PickerUtilsV2 } from "./utils";

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
  return _.includes(
    ["selection2link", "selectionExtract", "selection2Items"],
    button.type
  );
}

function isNoteBtn(button: DendronBtn) {
  return _.includes(["journal", "scratch", "task"], button.type);
}

function isSplitButton(button: DendronBtn) {
  return _.includes(["horizontal", "vertical"], button.type);
}

const selectionToNoteProps = async (opts: {
  selectionType: string;
  note: NoteProps;
}) => {
  const ext = ExtensionProvider.getExtension();
  const resp = await VSCodeUtils.extractRangeFromActiveEditor();
  const { document, range } = resp || {};
  const { selectionType, note } = opts;
  const { selection, text } = VSCodeUtils.getSelection();

  switch (selectionType) {
    case "selectionExtract": {
      if (!_.isUndefined(document)) {
        const ws = ExtensionProvider.getDWorkspace();
        const lookupConfig = ConfigUtils.getCommands(ws.config).lookup;
        const noteLookupConfig = lookupConfig.note;
        const leaveTrace = noteLookupConfig.leaveTrace || false;
        const body = "\n" + document.getText(range).trim();
        note.body = body;
        const { wsRoot, vaults } = ext.getDWorkspace();
        // don't delete if original file is not in workspace
        if (
          !WorkspaceUtils.isPathInWorkspace({
            wsRoot,
            vaults,
            fpath: document.uri.fsPath,
          })
        ) {
          return note;
        }
        if (leaveTrace) {
          const editor = VSCodeUtils.getActiveTextEditor();
          const link = NoteUtils.createWikiLink({
            note,
            useVaultPrefix: DendronClientUtilsV2.shouldUseVaultPrefix(
              ExtensionProvider.getEngine()
            ),
            alias: { mode: "title" },
          });
          await editor?.edit((builder) => {
            if (!_.isUndefined(selection) && !selection.isEmpty) {
              builder.replace(selection, `!${link}`);
            }
          });
        } else {
          await VSCodeUtils.deleteRange(document, range as vscode.Range);
        }
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
        }
      }
      return note;
    }
    default: {
      return note;
    }
  }
};

export class Selection2LinkBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new Selection2LinkBtn({
      title: "Selection to Link",
      description: MODIFIER_DESCRIPTIONS["selection2link"],
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
      description: MODIFIER_DESCRIPTIONS["selectionExtract"],
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

export class Selection2ItemsBtn extends DendronBtn {
  static create(opts: { pressed?: boolean; canToggle?: boolean }) {
    const { pressed, canToggle } = _.defaults(opts, {
      pressed: false,
      canToggle: true,
    });
    return new Selection2ItemsBtn({
      title: "Selection to Items",
      description: MODIFIER_DESCRIPTIONS["selection2Items"],
      iconOff: "checklist",
      iconOn: "menu-selection",
      type: "selection2Items",
      pressed,
      canToggle,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    const pickerItemsFromSelection =
      NotePickerUtils.createItemsFromSelectedWikilinks();
    quickPick.prevValue = quickPick.value;
    quickPick.value = "";
    quickPick.itemsFromSelection = pickerItemsFromSelection;
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    quickPick.itemsFromSelection = undefined;
    return;
  }
}

export class JournalBtn extends DendronBtn {
  static create(opts?: { pressed?: boolean; canToggle?: boolean }) {
    const { pressed, canToggle } = _.defaults(opts, {
      pressed: false,
      canToggle: true,
    });
    return new JournalBtn({
      title: "Create Journal Note",
      description: MODIFIER_DESCRIPTIONS["journal"],
      iconOff: "calendar",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.journal,
      pressed,
      canToggle,
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
  static create(opts: { pressed?: boolean; canToggle?: boolean }) {
    const { pressed, canToggle } = _.defaults(opts, {
      pressed: false,
      canToggle: true,
    });
    return new ScratchBtn({
      title: "Create Scratch Note",
      description: MODIFIER_DESCRIPTIONS["scratch"],
      iconOff: "new-file",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.scratch,
      pressed,
      canToggle,
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

export class TaskBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new TaskBtn({
      title: "Create Task Note",
      description: MODIFIER_DESCRIPTIONS["task"],
      iconOff: "diff-added",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.task,
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = () => {
      return DendronClientUtilsV2.genNoteName(LookupNoteTypeEnum.task);
    };
    quickPick.prevValue = quickPick.value;
    const { noteName, prefix } = quickPick.modifyPickerValueFunc();
    quickPick.noteModifierValue = _.difference(
      noteName.split("."),
      prefix.split(".")
    ).join(".");
    quickPick.prefix = prefix;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    // If the lookup value ends up being identical to the current note, this will be confusing for the user because
    // they won't be able to create a new note. This can happen with the default settings of Task notes.
    // In that case, we add a trailing dot to suggest that they need to type something more.
    const activeName = ExtensionProvider.getWSUtils().getActiveNote()?.fname;
    if (quickPick.value === activeName) quickPick.value = `${quickPick.value}.`;
    // Add default task note props to the created note
    quickPick.onCreate = async (note) => {
      note.custom = {
        ...TaskNoteUtils.genDefaultTaskNoteProps(
          note,
          ConfigUtils.getTask(ExtensionProvider.getDWorkspace().config)
        ).custom,
        ...note.custom,
      };
      return note;
    };
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
      description: MODIFIER_DESCRIPTIONS["horizontal"],
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
      description: MODIFIER_DESCRIPTIONS["directChildOnly"],
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
  static create(opts: { pressed?: boolean; canToggle?: boolean }) {
    const { pressed, canToggle } = _.defaults(opts, {
      pressed: false,
      canToggle: true,
    });
    return new MultiSelectBtn({
      title: "Multi-Select",
      description: MODIFIER_DESCRIPTIONS["multiSelect"],
      iconOff: "chrome-maximize",
      iconOn: "menu-selection",
      type: "multiSelect" as LookupEffectType,
      pressed,
      canToggle,
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
      description: MODIFIER_DESCRIPTIONS["copyNoteLink"],
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
      description: "",
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
    MultiSelectBtn.create({}),
    CopyNoteLinkBtn.create(),
    DirectChildFilterBtn.create(),
    SelectionExtractBtn.create(),
    Selection2LinkBtn.create(),
    Selection2ItemsBtn.create({}),
    JournalBtn.create(),
    ScratchBtn.create({}),
    HorizontalSplitBtn.create(),
    // VerticalSplitBtn.create(),
  ];
  typesToTurnOn.map((btnType) => {
    (_.find(buttons, { type: btnType }) as DendronBtn).pressed = true;
  });
  return buttons;
}
