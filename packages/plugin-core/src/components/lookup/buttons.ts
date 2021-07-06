import {
  DNodePropsQuickInputV2,
  NoteQuickInput,
  NoteUtils,
} from "@dendronhq/common-all";
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
import { clipboard } from "../../utils";
import { DendronQuickPickerV2 } from "./types";
import { PickerUtilsV2 } from "./utils";

export type ButtonType =
  | LookupEffectType
  | LookupNoteType
  | LookupSelectionType
  | LookupSplitType
  | LookupFilterType
  | "v2";

export type ButtonCategory =
  | "selection"
  | "note"
  | "split"
  | "filter"
  | "effect";

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

class Selection2LinkBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new DendronBtn({
      title: "Selection to Link",
      iconOff: "link",
      iconOn: "menu-selection",
      type: "selection2link",
      pressed,
    });
  }
}

class SlectionExtractBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new DendronBtn({
      title: "Selection Extract",
      iconOff: "find-selection",
      iconOn: "menu-selection",
      type: "selectionExtract",
      pressed,
    });
  }
}

class JournalBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new DendronBtn({
      title: "Create Journal Note",
      iconOff: "calendar",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.journal,
      pressed,
    });
  }
}

class ScratchBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new DendronBtn({
      title: "Create Scratch Note",
      iconOff: "new-file",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.scratch,
      pressed,
    });
  }
}
class HorizontalSplitBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new DendronBtn({
      title: "Split Horizontal",
      iconOff: "split-horizontal",
      iconOn: "menu-selection",
      type: "horizontal",
      pressed,
    });
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
      type: "v2" as LookupEffectType,
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
    SlectionExtractBtn.create(),
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
