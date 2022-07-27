import { QuickPickItem, QuickPick, QuickPickOptions } from "vscode";
import * as vscode from "vscode";
// import { NoteQuickInput } from "@dendronhq/common-all";
import { LookupProvider, NoteLookupProvider } from "./NoteLookupProvider";
import { DVault, NoteQuickInput } from "@dendronhq/common-all";
import { IReducedEngineAPIService } from "../engine";

export type LookupQuickpickFactoryCreateOpts = QuickPickOptions & {
  buttons: vscode.QuickInputButton[];
  provider: LookupProvider;
  wsRoot: string;
  vaults: DVault[];
};

export type LookupAcceptPayload = {
  items: readonly NoteQuickInput[];
};

export class LookupQuickpickFactory {
  private _engine: IReducedEngineAPIService;

  // TODO: Add injection annotations
  constructor(
    engine: IReducedEngineAPIService,
    private wsRoot: string,
    private vaults: DVault[]
  ) {
    this._engine = engine;
  }

  public ShowLookup(): Promise<LookupAcceptPayload | undefined> {
    const qp = this.Create({
      buttons: [],
      provider: new NoteLookupProvider(this._engine),
      wsRoot: this.wsRoot,
      vaults: this.vaults,
    });

    const outerPromise = new Promise<LookupAcceptPayload | undefined>(
      (outerResolve) => {
        const foo = new Promise<LookupAcceptPayload | undefined>((resolve) => {
          qp.onDidAccept(() => {
            resolve({
              items: qp.selectedItems,
            });
          });

          // qp.hi;
          qp.onDidHide(() => {
            resolve(undefined);
          });
        });

        foo.then((value) => {
          // TODO: Show the vault picker control if necessary
          outerResolve(value);
        });
      }
    );

    qp.show();

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

    // TODO: Add back stripping logic here based on just activated

    // let _justActivated = true;

    // Just activated picker's have special behavior:
    //
    // We slice the postfix off until the first dot to show all results at the same
    // level so that when a user types `foo.one`, they will see all results in `foo.*`
    // if (_justActivated) {
    //   pickerValue = NoteLookupUtils.getQsForCurrentLevel(pickerValue);
    // }
    qp.onDidChangeValue(async (_newInput) => {
      const items = await opts.provider.provideItems({
        // _justActivated,
        pickerValue: _newInput,
        showDirectChildrenOnly: false,
        workspaceState: {
          wsRoot: opts.wsRoot,
          vaults: opts.vaults,
          schemas: {},
        },
      });

      console.log(`Items Provided: ${items?.length}`);

      // _justActivated = false;

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
