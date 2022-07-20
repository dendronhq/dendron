import { QuickPick, QuickPickItem } from "vscode";

// Features:
// Auto Complete
//
export class LookupControllerFactory {
  create<T extends QuickPickItem>(): QuickPick<T> {
    throw new Error("Not Implemented");
  }
}
