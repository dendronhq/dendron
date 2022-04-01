import { LookupNoteType, LookupSelectionType } from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { QuickInputButton, ThemeIcon } from "vscode";

export type LookupFilterType = "directChildOnly";

export enum LookupEffectTypeEnum {
  "copyNoteLink" = "copyNoteLink",
  "copyNoteRef" = "copyNoteRef",
  "multiSelect" = "multiSelect",
}

export enum LookupSplitTypeEnum {
  "horizontal" = "horizontal",
}
export type LookupSplitType = "horizontal";

export type LookupEffectType = "copyNoteLink" | "copyNoteRef" | "multiSelect";
export type LookupNoteExistBehavior = "open" | "overwrite";
export type LookupSelectVaultType = "selectVault";

export type ButtonType =
  | LookupEffectType
  | LookupNoteType
  | LookupSelectionType
  | LookupSplitType
  | LookupFilterType
  | LookupSelectVaultType;

export type ButtonCategory =
  | "selection"
  | "note"
  | "split"
  | "filter"
  | "effect"
  | "selectVault";

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
  if (isSelectVaultButton(button)) {
    return "selectVault";
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

function isSelectVaultButton(button: DendronBtn) {
  return _.includes(["selectVault"], button.type);
}

export type IDendronQuickInputButton = QuickInputButton & {
  type: ButtonType;
  description: string;
  pressed: boolean;
};

type DendronBtnCons = {
  title: string;
  description: string;
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
  public description: string;
  private _pressed: boolean;
  public canToggle: boolean;
  public title: string;
  public opts: DendronBtnCons;

  public get pressed() {
    return this._pressed;
  }

  public set pressed(isPressed: boolean) {
    if (this.canToggle) {
      this._pressed = isPressed;
    }
  }

  onLookup = async (_payload: any) => {
    return;
  };

  constructor(opts: DendronBtnCons) {
    const { iconOff, iconOn, type, title, description, pressed } = opts;
    this.iconPathNormal = new vscode.ThemeIcon(iconOff);
    this.iconPathPressed = new vscode.ThemeIcon(iconOn);
    this.type = type;
    this.description = description;
    this._pressed = pressed || false;
    this.title = title;
    this.canToggle = _.isUndefined(opts.canToggle) ? true : opts.canToggle;
    this.opts = opts;
  }

  clone(): DendronBtn {
    return new DendronBtn({
      ...this.opts,
      pressed: this._pressed,
    });
  }

  get iconPath() {
    return !this.pressed ? this.iconPathNormal : this.iconPathPressed;
  }

  get tooltip(): string {
    return this.description
      ? `${this.title}, ${this.description}, status: ${
          this.pressed ? "on" : "off"
        }`
      : `${this.title}, status: ${this.pressed ? "on" : "off"}`;
  }

  toggle() {
    if (this.canToggle) {
      this.pressed = !this.pressed;
    }
  }
}
