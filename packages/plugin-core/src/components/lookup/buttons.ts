import _ from "lodash";
import * as vscode from "vscode";
import { QuickInputButton, ThemeIcon } from "vscode";
import {
  LookupNoteType,
  LookupSelectionType,
} from "../../commands/LookupCommand";
import { DendronQuickPicker, DendronQuickPickerV2 } from "./LookupProvider";

export type ButtonType = LookupNoteType | LookupSelectionType;

export type ButtonCategory = "selection" | "note";

export function getButtonCategory(button: DendronBtn): ButtonCategory {
  return isSelectionBtn(button) ? "selection" : "note";
}

function isSelectionBtn(button: DendronBtn) {
  return _.includes(["selection2link", "selectionExtract"], button.type);
}

export type IDendronQuickInputButton = QuickInputButton & {
  type: ButtonType;
  pressed: boolean;
  onLookup: (payload: any) => Promise<void>;
};

export class DendronBtn implements IDendronQuickInputButton {
  public iconPathNormal: ThemeIcon;
  public iconPathPressed: ThemeIcon;
  public type: ButtonType;
  public pressed: boolean;
  public title: string;
  onLookup = async (_payload: any) => {
    return;
  };

  constructor(opts: {
    title: string;
    iconOff: string;
    iconOn: string;
    type: ButtonType;
    pressed?: boolean;
  }) {
    const { iconOff, iconOn, type, title, pressed } = opts;
    this.iconPathNormal = new vscode.ThemeIcon(iconOff);
    this.iconPathPressed = new vscode.ThemeIcon(iconOn);
    this.type = type;
    this.pressed = pressed || false;
    this.title = title;
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
      type: "journal",
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
      type: "scratch",
      pressed,
    });
  }
}

export function refreshButtons(
  quickpick: DendronQuickPicker | DendronQuickPickerV2,
  buttons: IDendronQuickInputButton[]
) {
  quickpick.buttons = buttons;
}

export function createAllButtons(
  typesToTurnOn: ButtonType[] = []
): DendronBtn[] {
  const buttons = [
    SlectionExtractBtn.create(),
    Selection2LinkBtn.create(),
    JournalBtn.create(),
    ScratchBtn.create(),
  ];
  typesToTurnOn.map((btnType) => {
    (_.find(buttons, { type: btnType }) as DendronBtn).pressed = true;
  });
  return buttons;
}
