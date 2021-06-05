import { QuickInputButton, ThemeIcon } from "vscode";
import { DoctorQuickPicker, DoctorScopeType } from "./types";

export type ButtonType = DoctorScopeType;

export type ButtonHandleOpts = { quickPick: DoctorQuickPicker };

export type IDoctorQuickInputButton = QuickInputButton & {
  type: ButtonType;
  pressed: boolean;
};

type DoctorBtnConstructorOpts = {
  title: string;
  iconOff: string;
  iconOn: string;
  type: ButtonType;
  pressed?: boolean;
  canToggle?: boolean;
};

export class DoctorBtn implements IDoctorQuickInputButton {
  public iconPathNormal: ThemeIcon;
  public iconPathPressed: ThemeIcon;
  public type: ButtonType;
  public pressed: boolean;
  public canToggle: boolean;
  public title: string;
  public opts: DoctorBtnConstructorOpts;

  constructor(opts: DoctorBtnConstructorOpts) {
    const { iconOff, iconOn, type, title, pressed } = opts;
    this.iconPathNormal = new ThemeIcon(iconOff);
    this.iconPathPressed = new ThemeIcon(iconOn);
    this.type = type;
    this.pressed = pressed || false;
    this.title = title;
    this.canToggle = opts.canToggle || true;
    this.opts = opts;
  }

  clone(): DoctorBtn {
    return new DoctorBtn({
      ...this.opts,
    });
  }

  async onEnable(_opts: ButtonHandleOpts): Promise<void> {
    console.log("enabled");
    return undefined;
  }

  async onDisable(_opts: ButtonHandleOpts): Promise<void> {
    console.log("disabled");
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

export class ChangeScopeBtn extends DoctorBtn {
  static create(pressed?: boolean) {
    return new ChangeScopeBtn({
      title: "Change Scope",
      iconOff: "root-folder-opened",
      iconOn: "symbol-file",
      type: "workspace" as DoctorScopeType,
      pressed,
    });
  }
}
