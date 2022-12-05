import {
  DNodeUtils,
  DVault,
  FuseEngine,
  LookupNoteType,
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
  NoteLookupUtils,
  NoteQuickInputV2,
  type ReducedDEngine,
} from "@dendronhq/common-all";
import _ from "lodash";
import { inject, injectable } from "tsyringe";
import * as vscode from "vscode";
import { Event, QuickPickOptions } from "vscode";
import { Utils } from "vscode-uri";
import { DendronContext } from "../../../constants";
import { AutoCompleter } from "../../../utils/autoCompleter";
import { WSUtilsWeb } from "../../utils/WSUtils";
import { type ILookupProvider } from "./ILookupProvider";
import { VaultQuickPick } from "./VaultQuickPick";
import {
  DirectChildFilterBtn,
  JournalBtn,
  VaultSelectButton,
} from "../../../components/lookup/buttons";
import { DendronBtn } from "../../../components/lookup/ButtonTypes";
import { TwoWayBinding } from "../../../utils/TwoWayBinding";
import { ILookupViewModel } from "../../../components/lookup/LookupViewModel";
import {
  DendronWebQuickPick,
  VaultSelectionMode,
} from "../../../components/lookup/types";
import { LookupQuickPickView } from "./LookupQuickPickView";
import { NoteLookupUtilsWeb } from "../../utils/NoteLookupUtilsWeb";

const CREATE_NEW_LABEL = "Create New";

export type LookupControllerCreateOpts = QuickPickOptions & {
  provider: ILookupProvider;
  buttons?: DendronBtn[];
  initialValue?: string;
  noteType?: LookupNoteType;
  /**
   * When true, don't enable vault selection
   */
  disableVaultSelection?: boolean;
  /* if vault selection isn't disabled,
   * press button on init if true
   */
  vaultButtonPressed?: boolean;
  /** If vault selection isn't disabled, allow choosing the mode of selection.
   *  Defaults to true. */
  vaultSelectCanToggle?: boolean;
  vaultSelectionMode?: VaultSelectionMode;
  //default true
  allowCreateNew?: boolean;
};

export type LookupAcceptPayload = {
  items: readonly NoteQuickInputV2[];
  createNew?: boolean;
};

@injectable()
export class LookupController {
  private viewModel: ILookupViewModel;
  private _disposables: vscode.Disposable[] = [];
  constructor(
    @inject("ReducedDEngine") private _engine: ReducedDEngine,
    @inject("vaults") private vaults: DVault[],
    @inject("AutoCompleteEvent") private tabAutoCompleteEvent: Event<void>,
    private wsUtils: WSUtilsWeb,
    private lookupUtils: NoteLookupUtilsWeb
  ) {
    this.viewModel = {
      selectionState: new TwoWayBinding<LookupSelectionTypeEnum>(
        LookupSelectionTypeEnum.none
      ),
      vaultSelectionMode: new TwoWayBinding<VaultSelectionMode>(
        VaultSelectionMode.auto
      ),
      isMultiSelectEnabled: new TwoWayBinding<boolean>(false),
      isCopyNoteLinkEnabled: new TwoWayBinding<boolean>(false),
      isApplyDirectChildFilter: new TwoWayBinding<boolean>(false),
      nameModifierMode: new TwoWayBinding<LookupNoteTypeEnum>(
        LookupNoteTypeEnum.none
      ),
      isSplitHorizontally: new TwoWayBinding<boolean>(false),
    };
  }

  public showLookup(
    opts: LookupControllerCreateOpts
  ): Promise<LookupAcceptPayload | undefined> {
    let initialValue = opts?.initialValue;
    if (!initialValue) {
      initialValue = this.getInitialValueBasedOnActiveNote();
    }
    opts = _.defaults(opts, {
      initialValue,
      title: "Lookup Note",
    });
    const qp = this.createQuickPick(opts);
    this._disposables.push(
      new LookupQuickPickView(qp, this.viewModel, this.lookupUtils)
    );

    this.setupViewModelCallbacks(qp, initialValue, opts);

    this.initializeViewStateFromButtons(qp.buttons);

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
              vaultSelectionMode: this.viewModel.vaultSelectionMode.value,
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
      this._disposables.forEach((disposable) => disposable.dispose());
    });
    return lookupPromise;
  }

  public isJournalButtonPressed(): boolean {
    return this.viewModel.nameModifierMode.value === LookupNoteTypeEnum.journal;
  }

  createQuickPick(
    opts: LookupControllerCreateOpts
  ): DendronWebQuickPick<NoteQuickInputV2> {
    const qp = vscode.window.createQuickPick<NoteQuickInputV2>();
    let initialized = false; // Not really sure why this is needed. For some reason onDidChangeValue seems to get called before I think the callback is set up.

    qp.title = opts.title;

    // We slice the postfix off until the first dot to show all results at the same
    // level so that when a user types `foo.one`, they will see all results in `foo.*`
    const initialQueryValue = NoteLookupUtils.getQsForCurrentLevel(
      opts.initialValue ?? ""
    );
    if (!opts.buttons) {
      opts.buttons = [
        JournalBtn.create({
          pressed: opts.noteType === LookupNoteTypeEnum.journal,
        }),
        DirectChildFilterBtn.create(),
      ];
    }

    // start: multi vault selection check
    const isMultiVault = this.vaults.length > 1 && !opts.disableVaultSelection;
    const maybeVaultSelectButtonPressed = _.isUndefined(
      opts?.vaultButtonPressed
    )
      ? isMultiVault
      : isMultiVault && opts!.vaultButtonPressed;
    if (isMultiVault) {
      opts.buttons.push(
        VaultSelectButton.create({
          pressed: maybeVaultSelectButtonPressed,
          canToggle: opts?.vaultSelectCanToggle,
        })
      );
    }
    qp.buttons = opts.buttons ?? [];
    // --- end: multi vault selection check
    qp.value = opts.initialValue ?? "";

    opts.provider
      .provideItems({
        pickerValue: initialQueryValue,
        showDirectChildrenOnly: this.viewModel.isApplyDirectChildFilter.value,
        workspaceState: {
          vaults: this.vaults,
          schemas: {},
        },
      })
      .then((initialItems) => {
        if (initialItems && !qp.items.length) {
          qp.items = initialItems;
        }
        initialized = true;
      });

    qp.onDidChangeValue(async (newInput) => {
      if (!initialized && !opts.noteType) return;
      const items = await opts.provider!.provideItems({
        pickerValue: newInput,
        showDirectChildrenOnly: this.viewModel.isApplyDirectChildFilter.value,
        workspaceState: {
          vaults: this.vaults,
          schemas: {},
        },
      });

      const modifiedItems = this.addCreateNewOptionIfNecessary(
        newInput,
        items,
        opts.allowCreateNew
      );
      qp.items = modifiedItems;
    });
    qp.ignoreFocusOut = true;
    return qp as DendronWebQuickPick<NoteQuickInputV2>;
  }

  private getInitialValueBasedOnActiveNote() {
    const uri = vscode.window.activeTextEditor?.document.uri;
    if (!uri) return "";
    const initialValue = _.trimEnd(Utils.basename(uri), ".md");
    return initialValue;
  }

  private initializeViewStateFromButtons(buttons: DendronBtn[]) {
    if (
      this.lookupUtils.getButtonFromArray(LookupNoteTypeEnum.scratch, buttons)
        ?.pressed
    ) {
      this.viewModel.nameModifierMode.value = LookupNoteTypeEnum.scratch;
    } else if (
      this.lookupUtils.getButtonFromArray(LookupNoteTypeEnum.journal, buttons)
        ?.pressed
    ) {
      this.viewModel.nameModifierMode.value = LookupNoteTypeEnum.journal;
    } else if (
      this.lookupUtils.getButtonFromArray(LookupNoteTypeEnum.task, buttons)
        ?.pressed
    ) {
      this.viewModel.nameModifierMode.value = LookupNoteTypeEnum.task;
    }
    this.viewModel.isApplyDirectChildFilter.value =
      !!this.lookupUtils.getButtonFromArray("directChildOnly", buttons)
        ?.pressed;

    this.viewModel.vaultSelectionMode.value =
      this.lookupUtils.getButtonFromArray("selectVault", buttons)?.pressed
        ? VaultSelectionMode.alwaysPrompt
        : VaultSelectionMode.smart;
  }

  private addCreateNewOptionIfNecessary(
    queryOrig: string,
    items: NoteQuickInputV2[],
    allowCreateNew: boolean = true
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
      vaultsHaveSpaceForExactMatch &&
      allowCreateNew;

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

  private setupViewModelCallbacks(
    qp: DendronWebQuickPick<NoteQuickInputV2>,
    initialValue: string | undefined,
    opts: LookupControllerCreateOpts
  ) {
    const journalBtn = this.lookupUtils.getButtonFromArray(
      LookupNoteTypeEnum.journal,
      qp.buttons
    );
    if (journalBtn) {
      this._disposables.push(
        this.viewModel.nameModifierMode.bind(async (newValue, prevValue) => {
          switch (prevValue) {
            case LookupNoteTypeEnum.journal:
              if (journalBtn)
                this.lookupUtils.onJournalButtonToggled(
                  false,
                  qp,
                  initialValue
                );
              break;
            default:
              break;
          }

          switch (newValue) {
            case LookupNoteTypeEnum.journal:
              if (journalBtn) this.lookupUtils.onJournalButtonToggled(true, qp);
              break;
            case LookupNoteTypeEnum.none:
              break;
            default:
          }
        })
      );
    }

    const directChildBtn = this.lookupUtils.getButton(
      "directChildOnly",
      qp.buttons
    );
    if (directChildBtn) {
      this._disposables.push(
        this.viewModel.isApplyDirectChildFilter.bind(async (newValue) => {
          const items = await opts.provider.provideItems({
            pickerValue: qp.value,
            showDirectChildrenOnly: newValue,
            workspaceState: {
              vaults: this.vaults,
              schemas: {},
            },
          });
          qp.items = items;
        })
      );
    }

    const vaultSelectionBtn = this.lookupUtils.getButton(
      "selectVault",
      qp.buttons
    );
    if (vaultSelectionBtn) {
      this._disposables.push(
        this.viewModel.vaultSelectionMode.bind(async (newValue) => {
          this.viewModel.vaultSelectionMode.value = newValue;
        })
      );
    }

    const multiSelectBtn = this.lookupUtils.getButton(
      "multiSelect",
      qp.buttons
    );
    if (multiSelectBtn) {
      this._disposables.push(
        this.viewModel.isMultiSelectEnabled.bind(async (newValue) => {
          qp.canSelectMany = newValue;
        })
      );
    }
  }
}
