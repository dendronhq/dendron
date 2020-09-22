import _ from "lodash";
import * as vscode from "vscode";
import { QuickInputButton, ThemeIcon } from "vscode";
import { DendronQuickPicker } from "./LookupProvider";

export type ButtonType =
  | "selection2link"
  | "selectionExtract"
  | "journal"
  | "scratch";

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
  quickpick: DendronQuickPicker,
  buttons: IDendronQuickInputButton[]
) {
  quickpick.buttons = buttons;
}

export function createAllButtons(typeToTurnOn?: ButtonType): DendronBtn[] {
  const buttons = [
    SlectionExtractBtn.create(),
    Selection2LinkBtn.create(),
    JournalBtn.create(),
    ScratchBtn.create(),
  ];
  if (typeToTurnOn) {
    const btn = _.find(buttons, { type: typeToTurnOn }) as DendronBtn;
    btn.pressed = true;
  }
  return buttons;
}
