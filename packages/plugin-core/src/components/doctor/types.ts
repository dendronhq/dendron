import { QuickPick } from "vscode";
import { DoctorBtn } from "./buttons";

export type DoctorScopeType = "workspace" | "file";
export type DoctorQuickInput = {
  label: string;
  detail?: string;
  alwaysShow?: boolean;
};
export type DoctorQuickPickItem = QuickPick<DoctorQuickInput>;
export type DoctorQuickPicker = DoctorQuickPickItem & {
  /**
   * Buttons control modifiers for doctor
   */
  buttons: DoctorBtn[];
  nonInteractive?: boolean;
};

export type CreateQuickPickOpts = {
  title: string;
  placeholder: string;
  /**
   * QuickPick.ignoreFocusOut prop
   */
  ignoreFocusOut?: boolean;
  nonInteractive?: boolean;
};
