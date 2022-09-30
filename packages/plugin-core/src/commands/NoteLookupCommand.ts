import {
  ConfigUtils,
  DendronError,
  DVault,
  EngagementEvents,
  ErrorFactory,
  ErrorMessages,
  ERROR_STATUS,
  getJournalTitle,
  LookupNoteType,
  LookupNoteTypeEnum,
  LookupSelectionType,
  LookupSelectionTypeEnum,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  TemplateUtils,
} from "@dendronhq/common-server";
import { HistoryService, MetadataService } from "@dendronhq/engine-server";
import _ from "lodash";
import { Uri, window } from "vscode";
import {
  CopyNoteLinkBtn,
  DirectChildFilterBtn,
  HorizontalSplitBtn,
  JournalBtn,
  MultiSelectBtn,
  ScratchBtn,
  Selection2ItemsBtn,
  Selection2LinkBtn,
  SelectionExtractBtn,
  TaskBtn,
} from "../components/lookup/buttons";
import {
  LookupFilterType,
  LookupSplitType,
  LookupSplitTypeEnum,
} from "../components/lookup/ButtonTypes";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import {
  ILookupProviderV3,
  NoteLookupProviderChangeStateResp,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3Interface";
import { NotePickerUtils } from "../components/lookup/NotePickerUtils";
import { QuickPickTemplateSelector } from "../components/lookup/QuickPickTemplateSelector";
import {
  DendronQuickPickerV2,
  DendronQuickPickState,
  VaultSelectionMode,
} from "../components/lookup/types";
import {
  node2Uri,
  OldNewLocation,
  PickerUtilsV2,
} from "../components/lookup/utils";
import { VaultSelectionModeConfigUtils } from "../components/lookup/vaultSelectionModeConfigUtils";
import { DendronContext, DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { JournalNote } from "../traits/journal";
import { AnalyticsUtils, getAnalyticsPayload } from "../utils/analytics";
import { AutoCompleter } from "../utils/autoCompleter";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtilsV2 } from "../WSUtilsV2";
import { BaseCommand } from "./base";

export type CommandRunOpts = {
  initialValue?: string;
  noConfirm?: boolean;
  fuzzThreshold?: number;
  multiSelect?: boolean;
  copyNoteLink?: boolean;
  noteType?: LookupNoteType;
  selectionType?: LookupSelectionType;
  splitType?: LookupSplitType;
  /**
   * NOTE: currently, only one filter is supported
   */
  filterMiddleware?: LookupFilterType[];
  vaultSelectionMode?: VaultSelectionMode;
};

/**
 * Everything that's necessary to initialize the quickpick
 */
type CommandGatherOutput = {
  quickpick: DendronQuickPickerV2;
  controller: ILookupControllerV3;
  provider: ILookupProviderV3;
  noConfirm?: boolean;
  fuzzThreshold?: number;
};

/**
 * Passed into execute command
 */
export type CommandOpts = {
  selectedItems: readonly NoteQuickInput[];
  /** source of the command. Added for contextual UI analytics. */
  source?: string;
} & CommandGatherOutput;

export type CommandOutput = {
  quickpick: DendronQuickPickerV2;
  controller: ILookupControllerV3;
  provider: ILookupProviderV3;
};

type OnDidAcceptReturn = {
  uri: Uri;
  node: NoteProps;
  resp?: any;
};

export { CommandOpts as LookupCommandOptsV3 };

/**
 * Note look up command instance that is used by the UI.
 * */

export class NoteLookupCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandGatherOutput,
  CommandRunOpts
> {
  key = DENDRON_COMMANDS.LOOKUP_NOTE.key;
  protected _controller: ILookupControllerV3 | undefined;
  protected _provider: ILookupProviderV3 | undefined;
  protected _quickPick: DendronQuickPickerV2 | undefined;

  constructor() {
    super("LookupCommandV3");

    //  ^1h1dr08geo6c
    AutoCompletableRegistrar.OnAutoComplete(() => {
      if (this._quickPick) {
        this._quickPick.value = AutoCompleter.getAutoCompletedValue(
          this._quickPick
        );

        this.provider.onUpdatePickerItems({
          picker: this._quickPick,
        });
      }
    });
  }

  public get controller(): ILookupControllerV3 {
    if (_.isUndefined(this._controller)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "controller not set",
      });
    }
    return this._controller;
  }

  public set controller(controller: ILookupControllerV3 | undefined) {
    this._controller = controller;
  }

  public get provider(): ILookupProviderV3 {
    if (_.isUndefined(this._provider)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "provider not set",
      });
    }
    return this._provider;
  }

  /**
   * @deprecated
   *
   * This is not a good pattern and causes a lot of problems with state.
   * This will be deprecated so that we never have to swap out the provider
   * of an already existing instance of a lookup command.
   *
   * In the meantime, if you absolutely _have_ to provide a custom provider to an instance of
   * a lookup command, make sure the provider's id is `lookup`.
   */
  public set provider(provider: ILookupProviderV3 | undefined) {
    this._provider = provider;
  }

  async gatherInputs(opts?: CommandRunOpts): Promise<CommandGatherOutput> {
    const extension = ExtensionProvider.getExtension();
    const start = process.hrtime();
    const ws = extension.getDWorkspace();
    const lookupConfig = ConfigUtils.getCommands(ws.config).lookup;
    const noteLookupConfig = lookupConfig.note;
    let selectionType;
    switch (noteLookupConfig.selectionMode) {
      case "link": {
        selectionType = "selection2link";
        break;
      }
      case "none": {
        selectionType = "none";
        break;
      }
      case "extract":
      default: {
        selectionType = "selectionExtract";
        break;
      }
    }

    const confirmVaultOnCreate = noteLookupConfig.confirmVaultOnCreate;

    const copts: CommandRunOpts = _.defaults(opts || {}, {
      multiSelect: false,
      filterMiddleware: [],
      initialValue: NotePickerUtils.getInitialValueFromOpenEditor(),
      selectionType,
    } as CommandRunOpts);

    let vaultButtonPressed: boolean;
    if (copts.vaultSelectionMode) {
      vaultButtonPressed =
        copts.vaultSelectionMode === VaultSelectionMode.alwaysPrompt;
    } else {
      vaultButtonPressed =
        VaultSelectionModeConfigUtils.shouldAlwaysPromptVaultSelection();
    }

    const ctx = "NoteLookupCommand:gatherInput";
    Logger.info({ ctx, opts, msg: "enter" });
    // initialize controller and provider
    const disableVaultSelection = !confirmVaultOnCreate;
    if (_.isUndefined(this._controller)) {
      this._controller = extension.lookupControllerFactory.create({
        nodeType: "note",
        disableVaultSelection,
        vaultButtonPressed,
        extraButtons: [
          MultiSelectBtn.create({ pressed: copts.multiSelect }),
          CopyNoteLinkBtn.create(copts.copyNoteLink),
          DirectChildFilterBtn.create(
            copts.filterMiddleware?.includes("directChildOnly")
          ),
          SelectionExtractBtn.create({
            pressed:
              copts.selectionType === LookupSelectionTypeEnum.selectionExtract,
          }),
          Selection2LinkBtn.create(
            copts.selectionType === LookupSelectionTypeEnum.selection2link
          ),
          Selection2ItemsBtn.create({
            pressed:
              copts.selectionType === LookupSelectionTypeEnum.selection2Items,
          }),
          JournalBtn.create({
            pressed: copts.noteType === LookupNoteTypeEnum.journal,
          }),
          ScratchBtn.create({
            pressed: copts.noteType === LookupNoteTypeEnum.scratch,
          }),
          TaskBtn.create(copts.noteType === LookupNoteTypeEnum.task),
          HorizontalSplitBtn.create(
            copts.splitType === LookupSplitTypeEnum.horizontal
          ),
        ],
        enableLookupView: true,
      });
    }
    if (this._provider === undefined) {
      // hack. we need to do this because
      // moveSelectionTo sets a custom provider instead of the
      // one that lookup creates.
      // TODO: fix moveSelectionTo so that it doesn't rely on this.
      this._provider = extension.noteLookupProviderFactory.create("lookup", {
        allowNewNote: true,
        allowNewNoteWithTemplate: true,
        noHidePickerOnAccept: false,
        forceAsIsPickerValueUsage:
          copts.noteType === LookupNoteTypeEnum.scratch,
      });
    }
    const lc = this.controller;
    if (copts.fuzzThreshold) {
      lc.fuzzThreshold = copts.fuzzThreshold;
    }

    VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, true);

    const { quickpick } = await lc.prepareQuickPick({
      placeholder: "a seed",
      provider: this.provider,
      initialValue: copts.initialValue,
      nonInteractive: copts.noConfirm,
      alwaysShow: true,
    });
    this._quickPick = quickpick;

    const profile = getDurationMilliseconds(start);
    AnalyticsUtils.track(VSCodeEvents.NoteLookup_Gather, {
      duration: profile,
    });

    return {
      controller: this.controller,
      provider: this.provider,
      quickpick,
      noConfirm: copts.noConfirm,
      fuzzThreshold: copts.fuzzThreshold,
    };
  }

  async enrichInputs(
    opts: CommandGatherOutput
  ): Promise<CommandOpts | undefined> {
    const ctx = "NoteLookupCommand:enrichInputs";
    let promiseResolve: (
      value: CommandOpts | undefined
    ) => PromiseLike<CommandOpts | undefined>;
    HistoryService.instance().subscribev2("lookupProvider", {
      id: "lookup",
      listener: async (event) => {
        if (event.action === "done") {
          const data =
            event.data as NoteLookupProviderSuccessResp<OldNewLocation>;
          if (data.cancel) {
            this.cleanUp();
            promiseResolve(undefined);
          }
          const _opts: CommandOpts = {
            selectedItems: data.selectedItems,
            ...opts,
          };
          promiseResolve(_opts);
        } else if (event.action === "changeState") {
          const data = event.data as NoteLookupProviderChangeStateResp;

          // check if we hid the picker and there is no next picker
          if (data.action === "hide") {
            const { quickpick } = opts;
            Logger.debug({
              ctx,
              subscribers: HistoryService.instance().subscribersv2,
            });
            // check if user has hidden picker
            if (
              !_.includes(
                [
                  DendronQuickPickState.PENDING_NEXT_PICK,
                  DendronQuickPickState.FULFILLED,
                ],
                quickpick.state
              )
            ) {
              this.cleanUp();
              promiseResolve(undefined);
            }
          }
          // don't remove the lookup provider
          return;
        } else if (event.action === "error") {
          const error = event.data.error as DendronError;
          this.L.error({ error });
          this.cleanUp();
          promiseResolve(undefined);
        } else {
          const error = ErrorFactory.createUnexpectedEventError({ event });
          this.L.error({ error });
          this.cleanUp();
        }
      },
    });
    const promise = new Promise<CommandOpts | undefined>((resolve) => {
      promiseResolve = resolve as typeof promiseResolve;
      opts.controller.showQuickPick({
        provider: opts.provider,
        quickpick: opts.quickpick,
        nonInteractive: opts.noConfirm,
        fuzzThreshold: opts.fuzzThreshold,
      });
    });
    return promise;
  }

  getSelected({
    quickpick,
    selectedItems,
  }: Pick<
    CommandOpts,
    "selectedItems" | "quickpick"
  >): readonly NoteQuickInput[] {
    const { canSelectMany } = quickpick;
    return canSelectMany ? selectedItems : selectedItems.slice(0, 1);
  }

  /**
   * Executed after user accepts a quickpick item
   */
  async execute(opts: CommandOpts) {
    const ctx = "NoteLookupCommand:execute";
    Logger.info({ ctx, msg: "enter" });
    try {
      const { quickpick, selectedItems } = opts;
      const selected = this.getSelected({ quickpick, selectedItems });

      const extension = ExtensionProvider.getExtension();
      const ws = extension.getDWorkspace();

      const journalDateFormat = ConfigUtils.getJournal(ws.config).dateFormat;

      const out = await Promise.all(
        selected.map((item) => {
          // If we're in journal mode, then apply title and trait overrides
          if (this.isJournalButtonPressed()) {
            /**
             * this is a hacky title override for journal notes.
             * TODO: remove this once we implement a more general way to override note titles.
             * this is a hacky title override for journal notes.
             */
            const journalModifiedTitle = getJournalTitle(
              item.fname,
              journalDateFormat
            );

            if (journalModifiedTitle) {
              item.title = journalModifiedTitle;

              const journalTrait = new JournalNote(
                ExtensionProvider.getDWorkspace().config
              );
              if (item.traits) {
                item.traits.push(journalTrait.id);
              } else {
                item.traits = [journalTrait.id];
              }
            }
          } else if (
            ConfigUtils.getWorkspace(ws.config).enableFullHierarchyNoteTitle
          ) {
            item.title = NoteUtils.genTitleFromFullFname(item.fname);
          }
          return this.acceptItem(item);
        })
      );
      const notesToShow = out.filter(
        (ent) => !_.isUndefined(ent)
      ) as OnDidAcceptReturn[];
      if (!_.isUndefined(quickpick.copyNoteLinkFunc)) {
        await quickpick.copyNoteLinkFunc!(notesToShow.map((item) => item.node));
      }
      await _.reduce(
        notesToShow,
        async (acc, item) => {
          await acc;
          return quickpick.showNote!(item.uri);
        },
        Promise.resolve({})
      );
    } finally {
      this.cleanUp();
      Logger.info({ ctx, msg: "exit" });
    }
    return opts;
  }

  cleanUp() {
    const ctx = "NoteLookupCommand:cleanup";
    Logger.debug({ ctx, msg: "enter" });
    if (this._controller) {
      this._controller.onHide();
    }
    this.controller = undefined;
    HistoryService.instance().remove("lookup", "lookupProvider");
    VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
  }

  async acceptItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    let result: Promise<OnDidAcceptReturn | undefined>;
    const start = process.hrtime();
    const isNew = PickerUtilsV2.isCreateNewNotePicked(item);

    const isNewWithTemplate =
      PickerUtilsV2.isCreateNewNoteWithTemplatePicked(item);
    if (isNew) {
      if (isNewWithTemplate) {
        result = this.acceptNewWithTemplateItem(item);
      } else {
        result = this.acceptNewItem(item);
      }
    } else {
      result = this.acceptExistingItem(item);
    }
    const profile = getDurationMilliseconds(start);
    AnalyticsUtils.track(VSCodeEvents.NoteLookup_Accept, {
      duration: profile,
      isNew,
      isNewWithTemplate,
    });
    const metaData = MetadataService.instance().getMeta();
    if (_.isUndefined(metaData.firstLookupTime)) {
      MetadataService.instance().setFirstLookupTime();
    }
    MetadataService.instance().setLastLookupTime();
    return result;
  }

  async acceptExistingItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    const picker = this.controller.quickPick;
    const uri = node2Uri(item);
    const originalNoteFromItem = PickerUtilsV2.noteQuickInputToNote(item);
    const originalNoteDeepCopy = _.cloneDeep(originalNoteFromItem);

    if (picker.selectionProcessFunc !== undefined) {
      const processedNode = await picker.selectionProcessFunc(
        originalNoteDeepCopy
      );
      if (processedNode !== undefined) {
        if (!_.isEqual(originalNoteFromItem, processedNode)) {
          const engine = ExtensionProvider.getEngine();
          await engine.writeNote(processedNode);
        }
        return { uri, node: processedNode };
      }
    }
    return { uri, node: item };
  }

  /**
   * Given a selected note item that is a stub note,
   * Prepare it for accepting as a new item.
   * This removes the `stub` frontmatter
   * and applies schema if there is one that matches
   */
  async prepareStubItem(opts: {
    item: NoteQuickInput;
    engine: IEngineAPIService;
  }): Promise<NoteProps> {
    const { item, engine } = opts;

    const noteFromItem = PickerUtilsV2.noteQuickInputToNote(item);
    const preparedNote = await NoteUtils.updateStubWithSchema({
      stubNote: noteFromItem,
      engine,
    });
    return preparedNote;
  }

  async acceptNewItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    const ctx = "acceptNewItem";
    const picker = this.controller.quickPick;
    const fname = this.getFNameForNewItem(item);

    const engine = ExtensionProvider.getEngine();
    let nodeNew: NoteProps;
    if (item.stub) {
      Logger.info({ ctx, msg: "create stub" });
      nodeNew = await this.prepareStubItem({
        item,
        engine,
      });
    } else {
      const vault = await this.getVaultForNewNote({ fname, picker });
      if (vault === undefined) {
        // Vault will be undefined when user cancelled vault selection, so we
        // are going to cancel the creation of the note.
        return;
      }
      nodeNew = await NoteUtils.createWithSchema({
        noteOpts: {
          fname,
          vault,
          title: item.title,
          traits: item.traits,
        },
        engine,
      });
      if (picker.selectionProcessFunc !== undefined) {
        nodeNew = (await picker.selectionProcessFunc(nodeNew)) as NoteProps;
      }
    }

    const templateAppliedResp = await TemplateUtils.findAndApplyTemplate({
      note: nodeNew,
      engine,
      pickNote: async (choices: NoteProps[]) => {
        return WSUtilsV2.instance().promptForNoteAsync({
          notes: choices,
          quickpickTitle:
            "Select which template to apply or press [ESC] to not apply a template",
          nonStubOnly: true,
        });
      },
    });

    if (templateAppliedResp.error) {
      window.showWarningMessage(
        `Warning: Problem with ${nodeNew.fname} schema. ${templateAppliedResp.error.message}`
      );
    } else if (templateAppliedResp.data) {
      AnalyticsUtils.track(EngagementEvents.TemplateApplied, {
        source: this.key,
        ...TemplateUtils.genTrackPayload(nodeNew),
      });
    }

    if (picker.onCreate) {
      const nodeModified = await picker.onCreate(nodeNew);
      if (nodeModified) nodeNew = nodeModified;
    }
    const resp = await engine.writeNote(nodeNew);
    if (resp.error) {
      Logger.error({ ctx, error: resp.error });
      return;
    }

    const uri = NoteUtils.getURI({
      note: nodeNew,
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });
    return { uri, node: nodeNew, resp };
  }

  async acceptNewWithTemplateItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    const ctx = "acceptNewWithTemplateItem";
    const picker = this.controller.quickPick;
    const fname = this.getFNameForNewItem(item);

    const engine = ExtensionProvider.getEngine();
    let nodeNew: NoteProps = item;
    const vault = await this.getVaultForNewNote({ fname, picker });
    if (vault === undefined) {
      return;
    }
    nodeNew = NoteUtils.create({
      fname,
      vault,
      title: item.title,
    });
    const templateNote = await this.getTemplateForNewNote();
    if (templateNote) {
      TemplateUtils.applyTemplate({
        templateNote,
        targetNote: nodeNew,
        engine,
      });
    }

    // only enable selection 2 link
    if (
      picker.selectionProcessFunc !== undefined &&
      picker.selectionProcessFunc.name === "selection2link"
    ) {
      nodeNew = (await picker.selectionProcessFunc(nodeNew)) as NoteProps;
    }
    const resp = await engine.writeNote(nodeNew);
    if (resp.error) {
      Logger.error({ ctx, error: resp.error });
      return;
    }

    const uri = NoteUtils.getURI({
      note: nodeNew,
      wsRoot: engine.wsRoot,
    });
    return { uri, node: nodeNew, resp };
  }

  /**
   * TODO: align note creation file name choosing for follow a single path when accepting new item.
   *
   * Added to quickly fix the journal names not being created properly.
   */
  private getFNameForNewItem(item: NoteQuickInput) {
    if (this.isJournalButtonPressed()) {
      return PickerUtilsV2.getValue(this.controller.quickPick);
    } else {
      return item.fname;
    }
  }

  //  ^8jd6vr4qcsol
  private async getVaultForNewNote({
    fname,
    picker,
  }: {
    fname: string;
    picker: DendronQuickPickerV2;
  }) {
    const engine = ExtensionProvider.getEngine();

    const vaultsWithMatchingFile = new Set(
      (await engine.findNotesMeta({ fname })).map((n) => n.vault.fsPath)
    );

    // Try to get the default vault value.
    let vault: DVault | undefined = picker.vault
      ? picker.vault
      : PickerUtilsV2.getVaultForOpenEditor();

    // If our current context does not have vault or if our current context vault
    // already has a matching file name we want to ask the user for a different vault.
    if (vault === undefined || vaultsWithMatchingFile.has(vault.fsPath)) {
      // Available vaults are vaults that do not have the desired file name.
      const availVaults = engine.vaults.filter(
        (v) => !vaultsWithMatchingFile.has(v.fsPath)
      );

      if (availVaults.length > 1) {
        const promptedVault = await PickerUtilsV2.promptVault(availVaults);
        if (promptedVault === undefined) {
          // User must have cancelled vault selection.
          vault = undefined;
        } else {
          vault = promptedVault;
        }
      } else if (availVaults.length === 1) {
        // There is only a single vault that is available so we dont have to ask the user.
        vault = availVaults[0];
      } else {
        // We should never reach this as "Create New" should not be available as option
        // to the user when there are no available vaults.
        throw ErrorFactory.createInvalidStateError({
          message: ErrorMessages.formatShouldNeverOccurMsg(
            `No available vaults for file name.`
          ),
        });
      }
    }

    return vault;
  }

  private async getTemplateForNewNote(): Promise<NoteProps | undefined> {
    const selector = new QuickPickTemplateSelector();

    const templateNote = await selector.getTemplate({
      logger: this.L,
      providerId: "createNewWithTemplate",
    });

    return templateNote;
  }

  private isJournalButtonPressed() {
    return this.controller.isJournalButtonPressed();
  }

  addAnalyticsPayload(opts?: CommandOpts, resp?: CommandOpts) {
    const { source } = { ...opts, ...resp };
    return getAnalyticsPayload(source);
  }
}
