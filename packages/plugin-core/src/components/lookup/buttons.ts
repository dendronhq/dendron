import {
  DNodePropsQuickInputV2,
  NoteQuickInput,
  NoteUtils,
  NoteProps,
  getSlugger,
} from "@dendronhq/common-all";
import { getWS } from "../../workspace";
import _ from "lodash";
import * as vscode from "vscode";
import { QuickInputButton, ThemeIcon } from "vscode";
import {
  LookupEffectType,
  LookupFilterType,
  LookupNoteType,
  LookupNoteTypeEnum,
  LookupSelectionType,
  LookupSplitType,
} from "../../commands/LookupCommand";
import { clipboard, DendronClientUtilsV2, VSCodeUtils } from "../../utils";
import { DendronQuickPickerV2 } from "./types";
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
  | "other"; //TODO: better category name?

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
  const ws = getWS();
  const resp = await VSCodeUtils.extractRangeFromActiveEditor();
  const { document, range } = resp || {};
  const { selectionType, note } = opts;
  const { selection, text } = VSCodeUtils.getSelection();

  switch(selectionType) {
    case "selectionExtract": {
      if (!_.isUndefined(document)) {
        const body = "\n" + document.getText(range).trim();
        note.body = body;
        // don't delete if original file is not in workspace
        if (!ws.workspaceService?.isPathInWorkspace(document.uri.fsPath)) {
          return note;
        }
        await VSCodeUtils.deleteRange(document, range as vscode.Range);
      }
      return note;
    }
    case "selection2link": {
      if (!_.isUndefined(document)) {
        const editor = VSCodeUtils.getActiveTextEditor();
        await editor?.edit((builder) => {
          const link = note.fname;
          if (!_.isUndefined(selection) && !selection.isEmpty) {
            builder.replace(selection, `[[${text}|${link}]]`);
          }
        });
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
    this.canToggle = opts.canToggle || true;
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
    this.pressed = !this.pressed;
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
    
    quickPick.rawValue = quickPick.value;
    const { text } = VSCodeUtils.getSelection();
    const slugger = getSlugger();
    quickPick.value = [quickPick.value, slugger.slug(text!)].join(".");
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.selectionProcessFunc = undefined;
    quickPick.value = quickPick.rawValue;
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
    quickPick.modifyPickerValueFunc = (value: string) => {
      return DendronClientUtilsV2.genNoteName("JOURNAL", {
        overrides: { domain: value },
      });
    };
    quickPick.rawValue = quickPick.value;
    quickPick.value = quickPick.modifyPickerValueFunc(quickPick.rawValue);
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = undefined;
    quickPick.value = quickPick.rawValue;
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
    quickPick.modifyPickerValueFunc = (value: string) => {
      return DendronClientUtilsV2.genNoteName("SCRATCH", {
        overrides: { domain: value },
      });
    };
    quickPick.rawValue = quickPick.value;
    quickPick.value = quickPick.modifyPickerValueFunc(quickPick.rawValue);
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = undefined;
    quickPick.value = quickPick.rawValue;
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
    quickPick.showNote = async (uri) => vscode.window.showTextDocument(
      uri, 
      { viewColumn: vscode.ViewColumn.Beside }
    );
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
    quickPick.filterMiddleware = (items: NoteQuickInput[]) => {
      const depth = PickerUtilsV2.slashToDot(
        PickerUtilsV2.getValue(quickPick)
      ).split(".").length;
      items = PickerUtilsV2.filterByDepth(items, depth);
      items = PickerUtilsV2.filterNonStubs(items);
      return items;
    };
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.filterMiddleware = undefined;
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

export class CopyNoteLinkButton extends DendronBtn {
  static create(pressed?: boolean) {
    return new CopyNoteLinkButton({
      title: "Copy Note Link",
      iconOff: "clippy",
      iconOn: "menu-selection",
      type: "copyNoteLink" as LookupEffectType,
      pressed,
      canToggle: false,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    if (this.pressed) {
      let items: readonly DNodePropsQuickInputV2[];
      if (quickPick.canSelectMany) {
        items = quickPick.selectedItems;
      } else {
        items = quickPick.activeItems;
      }
      const links = items
        .filter((ent) => !PickerUtilsV2.isCreateNewNotePick(ent))
        .map((note) => NoteUtils.createWikiLink({ note }));
      if (_.isEmpty(links)) {
        vscode.window.showInformationMessage(`no items selected`);
      } else {
        await clipboard.writeText(links.join("\n"));
        vscode.window.showInformationMessage(`${links.length} links copied`);
      }
    }
  }
}

export class VaultSelectButton extends DendronBtn {
  static create(pressed?: boolean) {
    return new VaultSelectButton({
      title: "Select Vault",
      iconOff: "package",
      iconOn: "menu-selection",
      type: "other" as LookupEffectType,
      pressed,
      canToggle: false,
    });
  }
  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.nextPicker = async () => {
      const vault = await PickerUtilsV2.promptVault();
      return vault;
    };
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    if (quickPick.nextPicker) {
      delete quickPick["nextPicker"];
    }
  }
}

export function createAllButtons(
  typesToTurnOn: ButtonType[] = []
): DendronBtn[] {
  const buttons = [
    MultiSelectBtn.create(),
    CopyNoteLinkButton.create(),
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
