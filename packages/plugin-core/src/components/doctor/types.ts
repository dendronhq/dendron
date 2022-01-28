import { QuickPick } from "vscode";

export type DoctorScopeType = "workspace" | "file";

export type DoctorQuickInput = {
  label: string;
  detail?: string;
  alwaysShow?: boolean;
};

export type DoctorQuickPickItem = QuickPick<DoctorQuickInput>;

export type CreateQuickPickOpts = {
  title: string;
  placeholder: string;
  /**
   * QuickPick.ignoreFocusOut prop
   */
  ignoreFocusOut?: boolean;
  nonInteractive?: boolean;
};
