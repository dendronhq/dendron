import { QuickPickItem, QuickPick, QuickPickOptions } from "vscode";
import * as vscode from "vscode";
import { NoteQuickInput } from "@dendronhq/common-all";
import { LookupProvider } from "./NoteLookupProvider";

export type LookupQuickpickFactoryCreateOpts<T> = QuickPickOptions & {
  buttons: vscode.QuickInputButton[];
  provider: LookupProvider<T>;
};

export class LookupQuickpickFactory {
  static CreateDefault<T extends QuickPickItem>(): QuickPick<
    T extends QuickPickItem ? any : any
  > {
    const qp = vscode.window.createQuickPick<T>();

    qp.title = "Looky Looky";

    return qp;
  }

  static Create<T extends QuickPickItem>(
    opts: LookupQuickpickFactoryCreateOpts<T>
  ): QuickPick<T extends QuickPickItem ? any : any> {
    const qp = vscode.window.createQuickPick<T>();

    qp.title = opts.title;
    qp.buttons = opts.buttons;

    qp.onDidChangeValue((newInput) => {
      // qp.items = opts.provider.provideItems({
      //   _justActivated: false,
      //   nonInteractive: false,
      //   forceAsIsPickerValueUsage: false,
      //   pickerValue: undefined,
      //   prevQuickpickValue: undefined,
      //   showDirectChildrenOnly: false,
      //   workspaceState: {
      //     wsRoot: "",
      //     vaults: [],
      //     schemas: {},
      //   },
      // });
    });

    return qp;
  }
}
