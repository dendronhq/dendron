import { QuickPickItem, QuickPick, QuickPickOptions } from "vscode";
import * as vscode from "vscode";
// import { NoteQuickInput } from "@dendronhq/common-all";
import { NoteLookupProvider } from "./NoteLookupProvider";
import {
  DNodePropsQuickInputV2,
  DNodeUtils,
  DVault,
  NoteLookupUtils,
  NoteQuickInput,
} from "@dendronhq/common-all";
import { IReducedEngineAPIService } from "@dendronhq/plugin-common";
import { ILookupProvider } from "./ILookupProvider";
import { WSUtilsWeb } from "../../utils/WSUtils";

export type LookupQuickpickFactoryCreateOpts = QuickPickOptions & {
  buttons?: vscode.QuickInputButton[];
  provider?: ILookupProvider;
  initalValue?: string;
  // wsRoot: string;
  // vaults: DVault[];
};

export type LookupAcceptPayload = {
  items: readonly NoteQuickInput[];
  createNew?: boolean;
};

const CREATE_NEW_LABEL = "Create New";

function createNoActiveItem({
  fname,
  detail,
}: {
  fname: string;
  detail: string;
}): DNodePropsQuickInputV2 {
  const props = DNodeUtils.create({
    id: CREATE_NEW_LABEL,
    fname,
    type: "note",
    // @ts-ignore
    vault: {},
  });
  return {
    ...props,
    label: CREATE_NEW_LABEL,
    detail,
    alwaysShow: true,
  };
}

export class LookupQuickpickFactory {
  private _engine: IReducedEngineAPIService;

  // TODO: Add injection annotations
  constructor(
    engine: IReducedEngineAPIService,
    private wsRoot: string,
    private vaults: DVault[],
    private wsUtils: WSUtilsWeb
  ) {
    this._engine = engine;
  }

  public ShowLookup(
    opts?: LookupQuickpickFactoryCreateOpts
  ): Promise<LookupAcceptPayload | undefined> {
    const qp = this.Create({
      title: "Lookup Note",
      buttons: [],
      provider: new NoteLookupProvider(this._engine),
      initalValue: opts?.initalValue,
    });

    const outerPromise = new Promise<LookupAcceptPayload | undefined>(
      (outerResolve) => {
        const foo = new Promise<LookupAcceptPayload | undefined>((resolve) => {
          qp.onDidAccept(() => {
            resolve({
              items: qp.selectedItems,
            });

            qp.dispose();
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

    // Do this asynchronously
    if (!opts?.initalValue) {
      this.populateValueBasedOnInitialNote().then((activeNote) => {
        if (activeNote) {
          qp.value = activeNote.fname;
        }
      });
    }

    qp.show();

    return outerPromise;
  }

  public Create(
    opts: LookupQuickpickFactoryCreateOpts
  ): QuickPick<NoteQuickInput> {
    const qp = vscode.window.createQuickPick<NoteQuickInput>();

    qp.title = opts.title;
    qp.buttons = opts.buttons ?? [];

    // We slice the postfix off until the first dot to show all results at the same
    // level so that when a user types `foo.one`, they will see all results in `foo.*`
    const initialQueryValue = NoteLookupUtils.getQsForCurrentLevel(
      opts.initalValue ?? ""
    );

    qp.value = opts.initalValue ?? "";

    opts
      .provider! // TODO: Fix !
      .provideItems({
        // _justActivated,
        pickerValue: initialQueryValue,
        showDirectChildrenOnly: false,
        workspaceState: {
          wsRoot: this.wsRoot,
          vaults: this.vaults,
          schemas: {},
        },
      })
      .then((initialItems) => {
        if (initialItems) {
          qp.items = initialItems;
        }
      });

    qp.onDidChangeValue(async (_newInput) => {
      const items = await opts.provider!.provideItems({
        // _justActivated,
        pickerValue: _newInput,
        showDirectChildrenOnly: false,
        workspaceState: {
          wsRoot: this.wsRoot,
          vaults: this.vaults,
          schemas: {},
        },
      });

      console.log(`Items Provided: ${items?.length}`);

      // _justActivated = false;

      const createItem = createNoActiveItem({
        fname: qp.value,
        detail: "Note does not exist. Create?",
      });

      if (items) {
        items.push(createItem);
        qp.items = items;
      }
    });

    return qp;
  }

  private populateValueBasedOnInitialNote() {
    return this.wsUtils.getActiveNote();
  }
}

// export class LookupQuickPick<T extends QuickPickItem> {
//   get QuickPick<T>() {}
// }

// export interface LookupQuickPick<T extends QuickPickItem>
//   extends QuickPick<T> {}
