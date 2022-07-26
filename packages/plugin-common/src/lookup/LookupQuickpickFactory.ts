import { QuickPickItem, QuickPick, QuickPickOptions } from "vscode";
import * as vscode from "vscode";
// import { NoteQuickInput } from "@dendronhq/common-all";
import { LookupProvider, NoteLookupProvider } from "./NoteLookupProvider";
import { NoteQuickInput } from "@dendronhq/common-all";
import { IReducedEngineAPIService } from "../engine";

export type LookupQuickpickFactoryCreateOpts = QuickPickOptions & {
  buttons: vscode.QuickInputButton[];
  provider: LookupProvider;
};

export type LookupAcceptPayload = {
  items: string[];
};

export class LookupQuickpickFactory {
  private _engine: IReducedEngineAPIService;

  // TODO: Add injection annotations
  constructor(engine: IReducedEngineAPIService) {
    this._engine = engine;
  }

  public ShowLookup(): Promise<LookupAcceptPayload | undefined> {
    const qp = this.Create({
      buttons: [],
      provider: new NoteLookupProvider(this._engine),
    });

    const outerPromise = new Promise<LookupAcceptPayload | undefined>(
      (outerResolve) => {
        const foo = new Promise<LookupAcceptPayload | undefined>((resolve) => {
          qp.onDidAccept(() => {
            resolve({
              items: qp.selectedItems.map((value) => value.fname),
            });
          });

          // qp.hi;
          resolve(undefined);
        });

        foo.then((value) => {
          // TODO: Show the vault picker control if necessary
          outerResolve(value);
        });
      }
    );

    return outerPromise;
  }

  public CreateDefault<T extends QuickPickItem>(): QuickPick<
    T extends QuickPickItem ? any : any
  > {
    const qp = vscode.window.createQuickPick<T>();

    qp.title = "Looky Looky";

    return qp;
  }

  public Create(
    opts: LookupQuickpickFactoryCreateOpts
  ): QuickPick<NoteQuickInput> {
    const qp = vscode.window.createQuickPick<NoteQuickInput>();

    qp.title = opts.title;
    qp.buttons = opts.buttons;

    let _justActivated = true;
    qp.onDidChangeValue(async (_newInput) => {
      const items = await opts.provider.provideItems({
        _justActivated,
        nonInteractive: false,
        forceAsIsPickerValueUsage: false,
        pickerValue: _newInput,
        prevQuickpickValue: _newInput, // TODO: Can't be newInput
        showDirectChildrenOnly: false,
        workspaceState: {
          wsRoot: "",
          vaults: [],
          schemas: {},
        },
      });

      _justActivated = false;

      if (items) {
        qp.items = items;
      }
    });

    return qp;
  }
}

// export class LookupQuickPick<T extends QuickPickItem> {
//   get QuickPick<T>() {}
// }

// export interface LookupQuickPick<T extends QuickPickItem>
//   extends QuickPick<T> {}
