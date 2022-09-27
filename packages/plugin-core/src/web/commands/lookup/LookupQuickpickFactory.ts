import {
  DNodeUtils,
  DVault,
  FuseEngine,
  NoteLookupUtils,
  NoteQuickInputV2,
  type ReducedDEngine,
} from "@dendronhq/common-all";
import _ from "lodash";
import { inject, injectable } from "tsyringe";
import * as vscode from "vscode";
import { Event, QuickPick, QuickPickOptions } from "vscode";
import { Utils } from "vscode-uri";
import { DendronContext } from "../../../constants";
import { AutoCompleter } from "../../../utils/autoCompleter";
import { WSUtilsWeb } from "../../utils/WSUtils";
import { type ILookupProvider } from "./ILookupProvider";
import { VaultQuickPick } from "./VaultQuickPick";

const CREATE_NEW_LABEL = "Create New";

export type LookupQuickpickFactoryCreateOpts = QuickPickOptions & {
  provider: ILookupProvider;
  buttons?: vscode.QuickInputButton[];
  initialValue?: string;
};

export type LookupAcceptPayload = {
  items: readonly NoteQuickInputV2[];
  createNew?: boolean;
};

@injectable()
export class LookupQuickpickFactory {
  constructor(
    @inject("ReducedDEngine") private _engine: ReducedDEngine,
    @inject("vaults") private vaults: DVault[],
    @inject("AutoCompleteEvent") private tabAutoCompleteEvent: Event<void>,
    private wsUtils: WSUtilsWeb
  ) {}

  public showLookup(
    opts: LookupQuickpickFactoryCreateOpts
  ): Promise<LookupAcceptPayload | undefined> {
    let initialValue = opts?.initialValue;
    if (!initialValue) {
      initialValue = this.getInitialValueBasedOnActiveNote();
    }

    const qp = this.create({
      title: "Lookup Note",
      buttons: [],
      provider: opts.provider,
      initialValue,
    });

    this.tabAutoCompleteEvent(() => {
      qp.value = AutoCompleter.getAutoCompletedValue(qp);
    });

    // lookupPromise resolves when ALL input has been accepted or closed (file
    // name + vault picker prompts for example)
    const lookupPromise = new Promise<LookupAcceptPayload | undefined>(
      (outerResolve) => {
        const onInitialPromptResponse = new Promise<
          LookupAcceptPayload | undefined
        >((resolve) => {
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

        onInitialPromptResponse.then(async (value) => {
          if (
            value?.items.length === 1 &&
            value.items[0].label === CREATE_NEW_LABEL
          ) {
            // Show the vault picker control if necessary
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

          outerResolve(value);
        });
      }
    );

    qp.show();
    vscode.commands.executeCommand(
      "setContext",
      DendronContext.NOTE_LOOK_UP_ACTIVE,
      true
    );

    lookupPromise.finally(() => {
      vscode.commands.executeCommand(
        "setContext",
        DendronContext.NOTE_LOOK_UP_ACTIVE,
        false
      );
    });
    return lookupPromise;
  }

  create(opts: LookupQuickpickFactoryCreateOpts): QuickPick<NoteQuickInputV2> {
    const qp = vscode.window.createQuickPick<NoteQuickInputV2>();

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
        workspaceState: {
          vaults: this.vaults,
          schemas: {},
        },
      })
      .then((initialItems) => {
        if (initialItems) {
          qp.items = initialItems;
          initialized = true;
        }
      });

    qp.onDidChangeValue(async (newInput) => {
      if (!initialized) {
        return;
      }
      const items = await opts.provider!.provideItems({
        pickerValue: newInput,
        showDirectChildrenOnly: false,
        workspaceState: {
          vaults: this.vaults,
          schemas: {},
        },
      });

      const modifiedItems = this.addCreateNewOptionIfNecessary(newInput, items);
      qp.items = modifiedItems;
    });

    return qp;
  }

  private getInitialValueBasedOnActiveNote() {
    const uri = vscode.window.activeTextEditor?.document.uri;
    if (!uri) return "";
    const initialValue = _.trimEnd(Utils.basename(uri), ".md");
    return initialValue;
  }

  private addCreateNewOptionIfNecessary(
    queryOrig: string,
    items: NoteQuickInputV2[]
  ): NoteQuickInputV2[] {
    // if new notes are allowed and we didn't get a perfect match, append `Create New` option
    // to picker results
    // NOTE: order matters. we always pick the first item in single select mode

    // If each of the vaults in the workspace already have exact match of the file name
    // then we should not allow create new option.
    const queryOrigLowerCase = queryOrig.toLowerCase();
    const numberOfExactMatches = items.filter(
      (item) => item.fname.toLowerCase() === queryOrigLowerCase
    ).length;
    // Move this logic to controller:
    const vaultsHaveSpaceForExactMatch =
      this.vaults.length > numberOfExactMatches;

    // TODO: Add back the other criteria
    const shouldAddCreateNew =
      // sometimes lookup is in mode where new notes are not allowed (eg. move an existing note, this option is manually passed in)
      // this.opts.allowNewNote &&
      // notes can't end with dot, invalid note
      !queryOrig.endsWith(".") &&
      // if you can select mult notes, new note is not valid
      // !picker.canSelectMany &&
      // when you create lookup from selection, new note is not valid
      // !transformedQuery.wasMadeFromWikiLink &&
      vaultsHaveSpaceForExactMatch;

    if (shouldAddCreateNew) {
      const entryCreateNew = this.createNewNoteQPItem({
        fname: queryOrig,
        detail: "Note does not exist. Create?",
        vault: this.vaults[0], // Pass in a dummy value, this won't get used.
      });

      if (
        this.shouldBubbleUpCreateNew({
          numberOfExactMatches,
          querystring: queryOrig,
          // bubbleUpCreateNew,
        })
      ) {
        return [entryCreateNew, ...items];
      } else {
        return [...items, entryCreateNew];
      }
    } else {
      return items;
    }
  }

  private createNewNoteQPItem({
    fname,
    detail,
  }: {
    fname: string;
    detail: string;
    vault: DVault;
  }): NoteQuickInputV2 {
    const props = DNodeUtils.create({
      id: CREATE_NEW_LABEL,
      fname,
      type: "note",
      vault: this.vaults[0], // Pass in a dummy value, this won't get used.
    });

    return {
      ...props,
      label: CREATE_NEW_LABEL,
      detail,
      alwaysShow: true,
    };
  }

  /** This function presumes that 'CreateNew' should be shown and determines whether
   *  CreateNew should be at the top of the look up results or not. */
  private shouldBubbleUpCreateNew({
    numberOfExactMatches,
    querystring,
    bubbleUpCreateNew,
  }: {
    numberOfExactMatches: number;
    querystring: string;
    bubbleUpCreateNew?: boolean;
  }) {
    // We don't want to bubble up create new if there is an exact match since
    // vast majority of times if there is an exact match user wants to navigate to it
    // rather than create a new file with exact same file name in different vault.
    const noExactMatches = numberOfExactMatches === 0;

    // Note: one of the special characters is space/' ' which for now we want to allow
    // users to make the files with ' ' in them but we won't bubble up the create new
    // option for the special characters, including space. The more contentious part
    // about previous/current behavior is that we allow creation of files with
    // characters like '$' which FuseJS will not match (Meaning '$' will NOT match 'hi$world').
    const noSpecialQueryChars =
      !FuseEngine.doesContainSpecialQueryChars(querystring);

    if (_.isUndefined(bubbleUpCreateNew)) bubbleUpCreateNew = true;

    return noSpecialQueryChars && noExactMatches && bubbleUpCreateNew;
  }
}
