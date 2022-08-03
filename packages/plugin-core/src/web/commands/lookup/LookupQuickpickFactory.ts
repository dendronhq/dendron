import {
  DNodePropsQuickInputV2,
  DNodeUtils,
  DVault,
  NoteLookupUtils,
  NoteQuickInput,
} from "@dendronhq/common-all";
import path from "path";
import { inject, injectable } from "tsyringe";
import * as vscode from "vscode";
import { QuickPick, QuickPickOptions } from "vscode";
import { IReducedEngineAPIService } from "../../engine/IReducedEngineApiService";
import { WSUtilsWeb } from "../../utils/WSUtils";
import { ILookupProvider } from "./ILookupProvider";
import { VaultQuickPick } from "./VaultQuickPick";

export type LookupQuickpickFactoryCreateOpts = QuickPickOptions & {
  provider: ILookupProvider;
  buttons?: vscode.QuickInputButton[];
  initialValue?: string;
};

export type LookupAcceptPayload = {
  items: readonly NoteQuickInput[];
  createNew?: boolean;
};

const CREATE_NEW_LABEL = "Create New";

// if new notes are allowed and we didn't get a perfect match, append `Create New` option
// to picker results
// NOTE: order matters. we always pick the first item in single select mode
// Logger.debug({ ctx, msg: "active != qs" });

// If each of the vaults in the workspace already have exact match of the file name
// then we should not allow create new option.
// const queryOrigLowerCase = queryOrig.toLowerCase();
// const numberOfExactMatches = updatedItems.filter(
//   (item) => item.fname.toLowerCase() === queryOrigLowerCase
// ).length;
// Move this logic to controller:
// const vaultsHaveSpaceForExactMatch =
//   workspaceState.vaults.length > numberOfExactMatches;

// const shouldAddCreateNew =
//   // sometimes lookup is in mode where new notes are not allowed (eg. move an existing note, this option is manually passed in)
//   this.opts.allowNewNote &&
//   // notes can't end with dot, invalid note
//   !queryOrig.endsWith(".") &&
//   // if you can select mult notes, new note is not valid
//   !picker.canSelectMany &&
//   // when you create lookup from selection, new note is not valid
//   !transformedQuery.wasMadeFromWikiLink &&
//   vaultsHaveSpaceForExactMatch;

// if (shouldAddCreateNew) {
//   const entryCreateNew = NotePickerUtils.createNoActiveItem({
//     fname: queryOrig,
//     detail: CREATE_NEW_NOTE_DETAIL,
//   });

//   const bubbleUpCreateNew = ConfigUtils.getLookup(ws.config).note
//     .bubbleUpCreateNew;
//   if (
//     shouldBubbleUpCreateNew({
//       numberOfExactMatches,
//       querystring: queryOrig,
//       bubbleUpCreateNew,
//     })
//   ) {
//     updatedItems = [entryCreateNew, ...updatedItems];
//   } else {
//     updatedItems = [...updatedItems, entryCreateNew];
//   }
// }

function createNoActiveItem({
  fname,
  detail,
  vault, // TODO: This shouldn't be a parameter
}: {
  fname: string;
  detail: string;
  vault: DVault;
}): DNodePropsQuickInputV2 {
  const props = DNodeUtils.create({
    id: CREATE_NEW_LABEL,
    fname,
    type: "note",
    vault,
  });

  return {
    ...props,
    label: CREATE_NEW_LABEL,
    detail,
    alwaysShow: true,
  };
}

@injectable()
export class LookupQuickpickFactory {
  private _engine: IReducedEngineAPIService;
  private FUZZ_THRESHOLD = 0.2;

  constructor(
    @inject("IReducedEngineAPIService") engine: IReducedEngineAPIService,
    @inject("wsRootString") private wsRoot: string,
    @inject("vaults") private vaults: DVault[],
    private wsUtils: WSUtilsWeb
  ) {
    this._engine = engine;
  }

  public showLookup(
    opts: LookupQuickpickFactoryCreateOpts
  ): Promise<LookupAcceptPayload | undefined> {
    let initialValue = opts?.initialValue;
    if (!initialValue) {
      console.log(`QP Initial Value Set`);
      initialValue = this.getInitialValueBasedOnActiveNote();
    }

    const qp = this.create({
      title: "Lookup Note",
      buttons: [],
      provider: opts.provider,
      initialValue,
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

          qp.onDidHide(() => {
            resolve(undefined);
          });
        });

        foo.then(async (value) => {
          if (
            value?.items.length === 1 &&
            value.items[0].id === CREATE_NEW_LABEL
          ) {
            const vaultPicker = new VaultQuickPick(this._engine);
            const currentNote = await this.wsUtils.getActiveNote();
            const vault = await vaultPicker.getOrPromptVaultForNewNote({
              fname: value.items[0].fname,
              vault: currentNote?.vault ?? this.vaults[0],
              vaults: this.vaults,
            });

            if (!vault) {
              outerResolve(undefined);
            } else {
              value.items[0].vault = vault;
            }
          }
          // TODO: Show the vault picker control if necessary
          outerResolve(value);
        });
      }
    );

    console.log(`QP Show`);
    qp.show();

    return outerPromise;
  }

  create(opts: LookupQuickpickFactoryCreateOpts): QuickPick<NoteQuickInput> {
    const qp = vscode.window.createQuickPick<NoteQuickInput>();

    let initialized = false; // Not really sure why this is needed. For some reason onDidChangeValue seems to get called before I think the callback is set up.

    qp.title = opts.title;
    qp.buttons = opts.buttons ?? [];

    // We slice the postfix off until the first dot to show all results at the same
    // level so that when a user types `foo.one`, they will see all results in `foo.*`
    const initialQueryValue = NoteLookupUtils.getQsForCurrentLevel(
      opts.initialValue ?? ""
    );

    qp.value = opts.initialValue ?? "";

    opts.provider
      .provideItems({
        pickerValue: initialQueryValue,
        showDirectChildrenOnly: false,
        fuzzThreshold: this.FUZZ_THRESHOLD, // TODO: Make this configurable
        workspaceState: {
          wsRoot: this.wsRoot,
          vaults: this.vaults,
          schemas: {},
        },
      })
      .then((initialItems) => {
        if (initialItems) {
          console.log(
            `Initial Item Set Added with length ${initialItems.length}`
          );
          qp.items = initialItems;
          initialized = true;
        }
      });

    qp.onDidChangeValue(async (newInput) => {
      if (!initialized) {
        return;
      }
      console.log(
        `Provide Items called in onDidChangeValue for picker value ${newInput}`
      );
      const items = await opts.provider!.provideItems({
        pickerValue: newInput,
        showDirectChildrenOnly: false,
        fuzzThreshold: this.FUZZ_THRESHOLD,
        workspaceState: {
          wsRoot: this.wsRoot,
          vaults: this.vaults,
          schemas: {},
        },
      });

      console.log(`Items Provided in onDidChangeValue: ${items?.length}`);

      // TODO: Get the vault from a prompt if needed:

      const createItem = createNoActiveItem({
        fname: qp.value,
        detail: "Note does not exist. Create?",
        vault: this.vaults[0], // TODO: This is wrong
      });

      if (items) {
        items.push(createItem);
        qp.items = items;
        console.log("Items Replaced");
      }
    });

    return qp;
  }

  private getInitialValueBasedOnActiveNote() {
    const initialValue = path.basename(
      vscode.window.activeTextEditor?.document.uri.fsPath || "",
      ".md"
    );
    return initialValue;
  }
}
