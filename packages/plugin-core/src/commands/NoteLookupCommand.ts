import {
  DendronError,
  DVault,
  ERROR_STATUS,
  ErrorFactory,
  ErrorMessages,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  SchemaUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { DConfig, HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import { Uri } from "vscode";
import {
  CopyNoteLinkBtn,
  DirectChildFilterBtn,
  HorizontalSplitBtn,
  JournalBtn,
  MultiSelectBtn,
  ScratchBtn,
  Selection2LinkBtn,
  SelectionExtractBtn,
} from "../components/lookup/buttons";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import {
  ILookupProviderV3,
  NoteLookupProvider,
  NoteLookupProviderChangeStateResp,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3";
import {
  DendronQuickPickerV2,
  DendronQuickPickState,
  LookupFilterType,
  LookupNoteType,
  LookupNoteTypeEnum,
  LookupSelectionType,
  LookupSelectionTypeEnum,
  LookupSplitType,
  LookupSplitTypeEnum,
  VaultSelectionMode,
} from "../components/lookup/types";
import {
  node2Uri,
  NotePickerUtils,
  OldNewLocation,
  PickerUtilsV2,
} from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { getDWorkspace, getEngine } from "../workspace";
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
  controller: LookupControllerV3;
  provider: ILookupProviderV3;
  noConfirm?: boolean;
  fuzzThreshold?: number;
};

/**
 * Passed into execute command
 */
type CommandOpts = {
  selectedItems: readonly NoteQuickInput[];
} & CommandGatherOutput;

export type CommandOutput = {
  quickpick: DendronQuickPickerV2;
  controller: LookupControllerV3;
  provider: ILookupProviderV3;
};

type OnDidAcceptReturn = {
  uri: Uri;
  node: NoteProps;
  resp?: any;
};

export { CommandOpts as LookupCommandOptsV3 };

export class NoteLookupCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandGatherOutput,
  CommandRunOpts
> {
  key = DENDRON_COMMANDS.LOOKUP_NOTE.key;
  protected _controller: LookupControllerV3 | undefined;
  protected _provider: ILookupProviderV3 | undefined;

  constructor() {
    super("LookupCommandV3");
  }

  protected get controller(): LookupControllerV3 {
    if (_.isUndefined(this._controller)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "controller not set",
      });
    }
    return this._controller;
  }

  protected get provider(): ILookupProviderV3 {
    if (_.isUndefined(this._provider)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "provider not set",
      });
    }
    return this._provider;
  }

  async gatherInputs(opts?: CommandRunOpts): Promise<CommandGatherOutput> {
    const start = process.hrtime();
    const ws = getDWorkspace();
    const lookupConfig = DConfig.getConfig({
      config: ws.config,
      path: "commands.lookup",
      required: true,
    });
    const noteLookupConfig = lookupConfig.note;
    let selectionType: LookupSelectionType =
      LookupSelectionTypeEnum.selectionExtract;
    let confirmVaultOnCreate;
    if ("selectionMode" in noteLookupConfig) {
      const selectionMode = noteLookupConfig.selectionMode;
      switch (selectionMode) {
        case "extract": {
          selectionType = LookupSelectionTypeEnum.selectionExtract;
          break;
        }
        case "link": {
          selectionType = LookupSelectionTypeEnum.selection2link;
          break;
        }
        case "none": {
          selectionType = LookupSelectionTypeEnum.none;
          break;
        }
        default: {
          throw new DendronError({ message: "unsupported selection type." });
        }
      }
      confirmVaultOnCreate = noteLookupConfig.confirmVaultOnCreate;
    } else {
      selectionType = noteLookupConfig.selectionType;
      confirmVaultOnCreate = DConfig.getProp(
        ws.config,
        "lookupConfirmVaultOnCreate"
      );
    }

    const copts: CommandRunOpts = _.defaults(opts || {}, {
      multiSelect: false,
      filterMiddleware: [],
      initialValue: NotePickerUtils.getInitialValueFromOpenEditor(),
      selectionType,
    } as CommandRunOpts);
    const ctx = "NoteLookupCommand:gatherInput";
    Logger.info({ ctx, opts, msg: "enter" });
    // initialize controller and provider
    const disableVaultSelection = !confirmVaultOnCreate;
    this._controller = LookupControllerV3.create({
      nodeType: "note",
      disableVaultSelection,
      vaultButtonPressed:
        copts.vaultSelectionMode === VaultSelectionMode.alwaysPrompt,
      extraButtons: [
        MultiSelectBtn.create(copts.multiSelect),
        CopyNoteLinkBtn.create(copts.copyNoteLink),
        DirectChildFilterBtn.create(
          copts.filterMiddleware?.includes("directChildOnly")
        ),
        SelectionExtractBtn.create(
          copts.selectionType === LookupSelectionTypeEnum.selectionExtract
        ),
        Selection2LinkBtn.create(
          copts.selectionType === LookupSelectionTypeEnum.selection2link
        ),
        JournalBtn.create(copts.noteType === LookupNoteTypeEnum.journal),
        ScratchBtn.create(copts.noteType === LookupNoteTypeEnum.scratch),
        HorizontalSplitBtn.create(
          copts.splitType === LookupSplitTypeEnum.horizontal
        ),
      ],
    });
    this._provider = new NoteLookupProvider("lookup", {
      allowNewNote: true,
      noHidePickerOnAccept: false,
      forceAsIsPickerValueUsage: copts.noteType === LookupNoteTypeEnum.scratch,
    });
    const lc = this.controller;
    if (copts.fuzzThreshold) {
      lc.fuzzThreshold = copts.fuzzThreshold;
    }
    const { quickpick } = await lc.prepareQuickPick({
      title: "Lookup",
      placeholder: "a seed",
      provider: this.provider,
      initialValue: copts.initialValue,
      nonInteractive: copts.noConfirm,
      alwaysShow: true,
    });

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

  async execute(opts: CommandOpts) {
    const ctx = "NoteLookupCommand:execute";
    Logger.info({ ctx, msg: "enter" });
    try {
      const { quickpick, selectedItems } = opts;
      const selected = this.getSelected({ quickpick, selectedItems });
      const out = await Promise.all(
        selected.map((item) => {
          return this.acceptItem(item);
        })
      );
      const outClean = out.filter(
        (ent) => !_.isUndefined(ent)
      ) as OnDidAcceptReturn[];
      if (!_.isUndefined(quickpick.copyNoteLinkFunc)) {
        await quickpick.copyNoteLinkFunc!(outClean.map((item) => item.node));
      }
      await _.reduce(
        outClean,
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
    this.controller.onHide();
    HistoryService.instance().remove("lookup", "lookupProvider");
  }

  async acceptItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    let result: Promise<OnDidAcceptReturn | undefined>;
    const start = process.hrtime();
    const isNew = PickerUtilsV2.isCreateNewNotePick(item);
    if (isNew) {
      result = this.acceptNewItem(item);
    } else {
      result = this.acceptExistingItem(item);
    }
    const profile = getDurationMilliseconds(start);
    AnalyticsUtils.track(VSCodeEvents.NoteLookup_Accept, {
      duration: profile,
      isNew,
    });
    return result;
  }
  async acceptExistingItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    const uri = node2Uri(item);
    return { uri, node: item };
  }

  async acceptNewItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    const ctx = "acceptNewItem";
    const picker = this.controller.quickpick;
    const fname = this.getFNameForNewItem(item);

    const engine = getEngine();
    let nodeNew: NoteProps;
    if (item.stub) {
      Logger.info({ ctx, msg: "create stub" });
      nodeNew = engine.notes[item.id];
    } else {
      const vault = await this.getVaultForNewNote({ fname, picker });
      if (vault === undefined) {
        // Vault will be undefined when user cancelled vault selection, so we
        // are going to cancel the creation of the note.
        return;
      }

      nodeNew = NoteUtils.create({ fname, vault });
      if (picker.selectionProcessFunc !== undefined) {
        nodeNew = (await picker.selectionProcessFunc(nodeNew)) as NoteProps;
      }
      const schemaMatchResult = SchemaUtils.matchPath({
        notePath: fname,
        schemaModDict: engine.schemas,
      });
      if (schemaMatchResult) {
        NoteUtils.addSchema({
          note: nodeNew,
          schemaModule: schemaMatchResult.schemaModule,
          schema: schemaMatchResult.schema,
        });
      }
    }

    const maybeSchema = SchemaUtils.getSchemaFromNote({
      note: nodeNew,
      engine,
    });
    const maybeTemplate =
      maybeSchema?.schemas[nodeNew.schema?.schemaId as string].data.template;
    if (maybeSchema && maybeTemplate) {
      SchemaUtils.applyTemplate({
        template: maybeTemplate,
        note: nodeNew,
        engine,
      });
    }

    const maybeJournalTitleOverride = this.journalTitleOverride();
    if (!_.isUndefined(maybeJournalTitleOverride))
      nodeNew.title = maybeJournalTitleOverride;

    const resp = await engine.writeNote(nodeNew, {
      newNode: true,
    });
    if (resp.error) {
      Logger.error({ ctx, error: resp.error });
      return;
    }
    const uri = NoteUtils.getURI({
      note: nodeNew,
      wsRoot: getDWorkspace().wsRoot,
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
      return PickerUtilsV2.getValue(this.controller.quickpick);
    } else {
      return item.fname;
    }
  }

  private async getVaultForNewNote({
    fname,
    picker,
  }: {
    fname: string;
    picker: DendronQuickPickerV2;
  }) {
    const engine = getEngine();

    const vaultsWithMatchingFile = new Set(
      NoteUtils.getNotesByFname({ fname, notes: engine.notes }).map(
        (n) => n.vault.fsPath
      )
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

  /**
   * this is a hacky title override for journal notes.
   * TODO: remove this once we implement a more general way to override note titles.
   * this is a hacky title override for journal notes.
   * This only works when the journal note modifier was explicitly pressed
   * and when the date portion is the last bit of the hierarchy.
   * e.g.) if the picker value is journal.2021.08.13.some-stuff, we don't override (title is some-stuff)
   */
  journalTitleOverride(): string | undefined {
    if (this.isJournalButtonPressed()) {
      const quickpick = this.controller.quickpick;

      // note modifier value exists, and nothing else after that.
      if (
        quickpick.noteModifierValue &&
        quickpick.value.split(quickpick.noteModifierValue).slice(-1)[0] === ""
      ) {
        const [, ...maybeDatePortion] = quickpick.noteModifierValue.split(".");
        // we only override y.MM.dd
        if (maybeDatePortion.length === 3) {
          const maybeTitleOverride = maybeDatePortion.join("-");
          if (maybeTitleOverride.match(/\d\d\d\d-\d\d-\d\d$/)) {
            return maybeTitleOverride;
          }
        }
      }
    }
    return;
  }

  private isJournalButtonPressed() {
    const journalBtn = _.find(this.controller.state.buttons, (btn) => {
      return btn.type === LookupNoteTypeEnum.journal;
    });
    const isPressed = journalBtn?.pressed;
    return isPressed;
  }
}
