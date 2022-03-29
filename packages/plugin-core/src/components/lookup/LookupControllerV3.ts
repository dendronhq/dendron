import {
  assertUnreachable,
  ConfigUtils,
  DendronError,
  DNodeType,
  ERROR_STATUS,
  getSlugger,
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  TaskNoteUtils,
} from "@dendronhq/common-all";
import { HistoryService, WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { CancellationTokenSource } from "vscode";
import { DendronClientUtilsV2 } from "../../clientUtils";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Logger } from "../../logger";
import { clipboard } from "../../utils";
import { VersionProvider } from "../../versionProvider";
import { LookupPanelView } from "../../views/LookupPanelView";
import { VSCodeUtils } from "../../vsCodeUtils";
import { LookupV3QuickPickView } from "../views/LookupV3QuickPickView";
import { ButtonType, DendronBtn } from "./ButtonTypes";
import type {
  CreateQuickPickOpts,
  ILookupControllerV3,
  LookupControllerV3CreateOpts,
  PrepareQuickPickOpts,
  ShowQuickPickOpts,
} from "./LookupControllerV3Interface";
import { ILookupProviderV3 } from "./LookupProviderV3Interface";
import {
  ILookupViewModel,
  NameModifierMode,
  SelectionMode,
} from "./LookupViewModel";
import { NotePickerUtils } from "./NotePickerUtils";
import { DendronQuickPickerV2, VaultSelectionMode } from "./types";
import { PickerUtilsV2 } from "./utils";

export { LookupControllerV3CreateOpts };

/**
 * For initialization lifecycle,
 * see [[dendron://dendron.docs/pkg.plugin-core.t.lookup.arch]]
 */
export class LookupControllerV3 implements ILookupControllerV3 {
  public nodeType: DNodeType;
  private _cancelTokenSource?: CancellationTokenSource;

  private _quickPick?: DendronQuickPickerV2;

  public fuzzThreshold: number;
  private _provider?: ILookupProviderV3;

  private _title?: string;
  private _viewModel: ILookupViewModel;

  private _initButtons: DendronBtn[];

  private _disposables: vscode.Disposable[] = [];

  constructor(opts: {
    nodeType: DNodeType;
    buttons: DendronBtn[];
    fuzzThreshold?: number;
    disableLookupView?: boolean;
    title?: string;
    viewModel: ILookupViewModel;
  }) {
    const ctx = "LookupControllerV3:new";
    Logger.info({ ctx, msg: "enter" });
    const { buttons, nodeType } = opts;
    this.nodeType = nodeType;

    this._initButtons = buttons;
    this.fuzzThreshold = opts.fuzzThreshold || 0.6;
    this._cancelTokenSource = VSCodeUtils.createCancelSource();
    this._title = opts.title;

    this._viewModel = opts.viewModel;
    if (!opts.disableLookupView) {
      this._disposables.push(new LookupPanelView(this._viewModel));
    }
  }

  isJournalButtonPressed(): boolean {
    return this._viewModel.nameModifierMode.value === NameModifierMode.Journal;
  }

  async show(
    opts: CreateQuickPickOpts & {
      /**
       * Don't show quickpick
       */
      nonInteractive?: boolean;
      /**
       * Initial value for quickpick
       */
      initialValue?: string;
      provider: ILookupProviderV3;
    }
  ): Promise<DendronQuickPickerV2> {
    const { quickpick } = await this.prepareQuickPick(opts);
    return this.showQuickPick({ ...opts, quickpick });
  }

  public get quickPick(): DendronQuickPickerV2 {
    if (_.isUndefined(this._quickPick)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "quickpick not initialized",
      });
    }
    return this._quickPick;
  }

  public get cancelToken() {
    if (_.isUndefined(this._cancelTokenSource)) {
      throw new DendronError({ message: "no cancel token" });
    }
    return this._cancelTokenSource;
  }

  get provider() {
    if (_.isUndefined(this._provider)) {
      throw new DendronError({ message: "no provider" });
    }
    return this._provider;
  }

  public createCancelSource() {
    const tokenSource = new CancellationTokenSource();
    if (this._cancelTokenSource) {
      this._cancelTokenSource.cancel();
      this._cancelTokenSource.dispose();
    }
    this._cancelTokenSource = tokenSource;
    return tokenSource;
  }

  /**
   * Wire up quickpick and initialize buttons
   */
  public async prepareQuickPick(
    opts: PrepareQuickPickOpts
  ): Promise<{ quickpick: DendronQuickPickerV2 }> {
    const ctx = "prepareQuickPick";
    Logger.info({ ctx, msg: "enter" });
    const { provider, title, selectAll } = _.defaults(opts, {
      nonInteractive: false,
      title:
        this._title ||
        [
          `Lookup (${this.nodeType})`,
          `- version: ${VersionProvider.version()}`,
        ].join(" "),
      selectAll: false,
    });
    this._provider = provider;
    const quickpick = PickerUtilsV2.createDendronQuickPick(opts);
    this._quickPick = quickpick;
    // invoke button behaviors
    this._quickPick.buttons = this._initButtons;
    this.setupViewModelCallbacks();

    // Now Create the Views:
    this._disposables.push(
      new LookupV3QuickPickView(quickpick, this._viewModel, this._provider.id)
    );

    // Set the initial View Model State from the initial Button state:
    this.initializeViewStateFromButtons(this._initButtons);

    quickpick.onDidHide(() => {
      if (opts.onDidHide) {
        opts.onDidHide();
      }

      Logger.debug({ ctx: "quickpick", msg: "onHide" });

      HistoryService.instance().add({
        source: "lookupProvider",
        action: "changeState",
        id: provider.id,
        data: { action: "hide" },
      });
    });
    quickpick.title = title;

    quickpick.selectAll = quickpick.canSelectMany && selectAll;

    Logger.info({ ctx, msg: "exit" });
    return { quickpick };
  }

  public async showQuickPick(opts: ShowQuickPickOpts) {
    const ctx = "showQuickPick";
    Logger.info({ ctx, msg: "enter" });
    const cancelToken = this.createCancelSource();
    const { nonInteractive, provider, quickpick } = _.defaults(opts, {
      nonInteractive: false,
    });
    Logger.info({ ctx, msg: "onUpdatePickerItems:pre" });
    // initial call of update
    if (!nonInteractive) {
      // Show the quickpick first before getting item data to ensure we don't
      // miss user key strokes
      quickpick.show();

      provider.onUpdatePickerItems({
        picker: quickpick,
        token: cancelToken.token,
        fuzzThreshold: this.fuzzThreshold,
      });

      provider.provide({
        quickpick,
        token: cancelToken,
        fuzzThreshold: this.fuzzThreshold,
      });
    } else {
      await provider.onUpdatePickerItems({
        picker: quickpick,
        token: cancelToken.token,
        fuzzThreshold: this.fuzzThreshold,
      });

      quickpick.selectedItems = quickpick.items;
      await provider.onDidAccept({
        quickpick,
        cancellationToken: cancelToken,
      })();
    }
    Logger.info({ ctx, msg: "exit" });
    return quickpick;
  }

  public onHide() {
    const ctx = "LookupControllerV3:onHide";
    this._quickPick?.dispose();
    this._quickPick = undefined;
    this._cancelTokenSource?.dispose();

    this._disposables.forEach((disposable) => disposable.dispose());
    Logger.info({ ctx, msg: "exit" });
  }

  private getButtonFromArray(type: ButtonType, buttons: DendronBtn[]) {
    return _.find(buttons, (value) => value.type === type);
  }

  private getButton(type: ButtonType): DendronBtn | undefined {
    if (this._quickPick) {
      return this.getButtonFromArray(type, this._quickPick?.buttons);
    }
    return;
  }

  private setupViewModelCallbacks(): void {
    const ToLinkBtn = this.getButton("selection2link");
    const ExtractBtn = this.getButton("selectionExtract");
    const ToItemsBtn = this.getButton("selection2Items");

    if (ToLinkBtn || ExtractBtn || ToItemsBtn) {
      this._disposables.push(
        this._viewModel.selectionState.bind(async (newValue, prevValue) => {
          switch (prevValue) {
            case SelectionMode.selection2Items: {
              this.onSelect2ItemsBtnToggled(false);
              break;
            }
            case SelectionMode.selection2Link: {
              this.onSelection2LinkBtnToggled(false);
              break;
            }
            case SelectionMode.selectionExtract: {
              this.onSelectionExtractBtnToggled(false);
              break;
            }
            default:
              break;
          }

          switch (newValue) {
            case SelectionMode.selection2Items: {
              this.onSelect2ItemsBtnToggled(true);
              break;
            }
            case SelectionMode.selection2Link: {
              this.onSelection2LinkBtnToggled(true);
              break;
            }
            case SelectionMode.selectionExtract: {
              this.onSelectionExtractBtnToggled(true);
              break;
            }
            case SelectionMode.None: {
              break;
            }
            default:
              assertUnreachable(newValue);
          }
        })
      );
    }

    const vaultSelectionBtn = this.getButton("other");
    if (vaultSelectionBtn) {
      this._disposables.push(
        this._viewModel.vaultSelectionMode.bind(async (newValue) => {
          //TODO: Cheeck if this observes the negative condition correctly
          this.setNextPicker({ quickPick: this.quickPick, mode: newValue });
        })
      );
    }

    const multiSelectBtn = this.getButton("multiSelect");
    if (multiSelectBtn) {
      this._disposables.push(
        this._viewModel.isMultiSelectEnabled.bind(async (newValue) => {
          this.quickPick.canSelectMany = newValue;
        })
      );
    }

    const copyLinkBtn = this.getButton("copyNoteLink");
    if (copyLinkBtn) {
      this._disposables.push(
        this._viewModel.isCopyNoteLinkEnabled.bind(async (enabled) => {
          this.onCopyNoteLinkBtnToggled(enabled);
        })
      );
    }

    const directChildBtn = this.getButton("directChildOnly");
    if (directChildBtn) {
      this._disposables.push(
        this._viewModel.isApplyDirectChildFilter.bind(async (newValue) => {
          this.quickPick.showDirectChildrenOnly = newValue;

          if (newValue) {
            this.quickPick.filterMiddleware = (items: NoteQuickInput[]) =>
              items;
          } else {
            this.quickPick.filterMiddleware = undefined;
          }

          await this.provider.onUpdatePickerItems({
            picker: this.quickPick,
            token: this.cancelToken.token,
            forceUpdate: true,
          });
        })
      );
    }

    const journalBtn = this.getButton(LookupNoteTypeEnum.journal);
    const scratchBtn = this.getButton(LookupNoteTypeEnum.scratch);
    const taskBtn = this.getButton(LookupNoteTypeEnum.task);

    if (journalBtn || scratchBtn || taskBtn) {
      this._disposables.push(
        this._viewModel.nameModifierMode.bind(async (newValue, prevValue) => {
          switch (prevValue) {
            case NameModifierMode.Journal:
              if (journalBtn) this.onJournalButtonToggled(false);
              break;
            case NameModifierMode.Scratch:
              if (scratchBtn) this.onScratchButtonToggled(false);
              break;
            case NameModifierMode.Task:
              if (taskBtn) this.onTaskButtonToggled(false);
              break;
            default:
              break;
          }

          switch (newValue) {
            case NameModifierMode.Journal:
              if (journalBtn) this.onJournalButtonToggled(true);
              break;
            case NameModifierMode.Scratch:
              if (scratchBtn) this.onScratchButtonToggled(true);
              break;
            case NameModifierMode.Task:
              if (taskBtn) this.onTaskButtonToggled(true);
              break;
            case NameModifierMode.None:
              break;
            default:
              assertUnreachable(newValue);
          }
        })
      );
    }

    const horizontalBtn = this.getButton("horizontal");
    if (horizontalBtn) {
      this._disposables.push(
        this._viewModel.isSplitHorizontally.bind(async (splitHorizontally) => {
          if (splitHorizontally) {
            this.quickPick.showNote = async (uri) =>
              vscode.window.showTextDocument(uri, {
                viewColumn: vscode.ViewColumn.Beside,
              });
          } else {
            this.quickPick.showNote = async (uri) =>
              vscode.window.showTextDocument(uri);
          }
        })
      );
    }
  }

  /**
   *  Adjust View State based on what the initial button state is
   * @param buttons
   */
  private initializeViewStateFromButtons(buttons: DendronBtn[]) {
    if (
      this.getButtonFromArray(LookupSelectionTypeEnum.selection2Items, buttons)
        ?.pressed
    ) {
      this._viewModel.selectionState.value = SelectionMode.selection2Items;
    } else if (
      this.getButtonFromArray(LookupSelectionTypeEnum.selection2link, buttons)
        ?.pressed
    ) {
      this._viewModel.selectionState.value = SelectionMode.selection2Link;
    } else if (
      this.getButtonFromArray(LookupSelectionTypeEnum.selectionExtract, buttons)
        ?.pressed
    ) {
      this._viewModel.selectionState.value = SelectionMode.selectionExtract;
    }

    if (this.getButtonFromArray(LookupNoteTypeEnum.scratch, buttons)?.pressed) {
      this._viewModel.nameModifierMode.value = NameModifierMode.Scratch;
    } else if (
      this.getButtonFromArray(LookupNoteTypeEnum.journal, buttons)?.pressed
    ) {
      this._viewModel.nameModifierMode.value = NameModifierMode.Journal;
    } else if (
      this.getButtonFromArray(LookupNoteTypeEnum.task, buttons)?.pressed
    ) {
      this._viewModel.nameModifierMode.value = NameModifierMode.Task;
    }

    this._viewModel.vaultSelectionMode.value = this.getButtonFromArray(
      "other",
      buttons
    )?.pressed
      ? VaultSelectionMode.alwaysPrompt
      : VaultSelectionMode.smart;

    this._viewModel.isMultiSelectEnabled.value = !!this.getButtonFromArray(
      "multiSelect",
      buttons
    )?.pressed;

    this._viewModel.isCopyNoteLinkEnabled.value = !!this.getButtonFromArray(
      "copyNoteLink",
      buttons
    )?.pressed;

    this._viewModel.isApplyDirectChildFilter.value = !!this.getButtonFromArray(
      "directChildOnly",
      buttons
    )?.pressed;

    this._viewModel.isSplitHorizontally.value = !!this.getButtonFromArray(
      "horizontal",
      buttons
    )?.pressed;
  }

  private setNextPicker({
    quickPick,
    mode,
  }: {
    quickPick: DendronQuickPickerV2;
    mode: VaultSelectionMode;
  }) {
    quickPick.nextPicker = async (opts: { note: NoteProps }) => {
      const { note } = opts;
      const currentVault = PickerUtilsV2.getVaultForOpenEditor();
      const vaultSelection = await PickerUtilsV2.getOrPromptVaultForNewNote({
        vault: currentVault,
        fname: note.fname,
        vaultSelectionMode: mode,
      });

      if (_.isUndefined(vaultSelection)) {
        vscode.window.showInformationMessage("Note creation cancelled.");
        return;
      }

      return vaultSelection;
    };
  }

  private onJournalButtonToggled(enabled: boolean) {
    const quickPick = this._quickPick!;
    if (enabled) {
      quickPick.modifyPickerValueFunc = () => {
        return DendronClientUtilsV2.genNoteName("JOURNAL");
      };

      const { noteName, prefix } = quickPick.modifyPickerValueFunc();

      quickPick.noteModifierValue = _.difference(
        noteName.split("."),
        prefix.split(".")
      ).join(".");
      quickPick.prevValue = quickPick.value;
      quickPick.prefix = prefix;
      quickPick.value = NotePickerUtils.getPickerValue(quickPick);
      return;
    } else {
      quickPick.modifyPickerValueFunc = undefined;
      quickPick.noteModifierValue = undefined;
      quickPick.prevValue = quickPick.value;
      quickPick.prefix = quickPick.rawValue;
      quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    }
  }

  private onScratchButtonToggled(enabled: boolean) {
    const quickPick = this._quickPick!;
    if (enabled) {
      quickPick.modifyPickerValueFunc = () => {
        return DendronClientUtilsV2.genNoteName("SCRATCH");
      };
      quickPick.prevValue = quickPick.value;
      const { noteName, prefix } = quickPick.modifyPickerValueFunc();
      quickPick.noteModifierValue = _.difference(
        noteName.split("."),
        prefix.split(".")
      ).join(".");
      quickPick.prefix = prefix;
      quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    } else {
      quickPick.modifyPickerValueFunc = undefined;
      quickPick.noteModifierValue = undefined;
      quickPick.prevValue = quickPick.value;
      quickPick.prefix = quickPick.rawValue;
      quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    }
  }

  private onTaskButtonToggled(enabled: boolean) {
    const quickPick = this._quickPick!;
    if (enabled) {
      quickPick.modifyPickerValueFunc = () => {
        return DendronClientUtilsV2.genNoteName(LookupNoteTypeEnum.task);
      };
      quickPick.prevValue = quickPick.value;
      const { noteName, prefix } = quickPick.modifyPickerValueFunc();
      quickPick.noteModifierValue = _.difference(
        noteName.split("."),
        prefix.split(".")
      ).join(".");
      quickPick.prefix = prefix;
      quickPick.value = NotePickerUtils.getPickerValue(quickPick);
      // If the lookup value ends up being identical to the current note, this will be confusing for the user because
      // they won't be able to create a new note. This can happen with the default settings of Task notes.
      // In that case, we add a trailing dot to suggest that they need to type something more.
      const activeName = ExtensionProvider.getWSUtils().getActiveNote()?.fname;
      if (quickPick.value === activeName)
        quickPick.value = `${quickPick.value}.`;
      // Add default task note props to the created note
      quickPick.onCreate = async (note) => {
        note.custom = {
          ...TaskNoteUtils.genDefaultTaskNoteProps(
            note,
            ConfigUtils.getTask(ExtensionProvider.getDWorkspace().config)
          ).custom,
          ...note.custom,
        };
        return note;
      };
      return;
    } else {
      quickPick.modifyPickerValueFunc = undefined;
      quickPick.noteModifierValue = undefined;
      quickPick.prevValue = quickPick.value;
      quickPick.prefix = quickPick.rawValue;
      quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    }
  }

  private onSelect2ItemsBtnToggled(enabled: boolean) {
    const quickPick = this._quickPick!;
    if (enabled) {
      const pickerItemsFromSelection =
        NotePickerUtils.createItemsFromSelectedWikilinks();
      quickPick.prevValue = quickPick.value;
      quickPick.value = "";
      quickPick.itemsFromSelection = pickerItemsFromSelection;
    } else {
      quickPick.value = NotePickerUtils.getPickerValue(quickPick);
      quickPick.itemsFromSelection = undefined;
      return;
    }
  }

  private onCopyNoteLinkBtnToggled(enabled: boolean) {
    const quickPick = this._quickPick!;
    if (enabled) {
      quickPick.copyNoteLinkFunc = async (items: NoteProps[]) => {
        const links = items.map((note) =>
          NoteUtils.createWikiLink({ note, alias: { mode: "title" } })
        );
        if (_.isEmpty(links)) {
          vscode.window.showInformationMessage(`no items selected`);
        } else {
          await clipboard.writeText(links.join("\n"));
          vscode.window.showInformationMessage(`${links.length} links copied`);
        }
      };
    } else {
      quickPick.copyNoteLinkFunc = undefined;
    }
  }

  private onSelectionExtractBtnToggled(enabled: boolean) {
    const quickPick = this._quickPick!;
    if (enabled) {
      quickPick.selectionProcessFunc = (note: NoteProps) => {
        return this.selectionToNoteProps({
          selectionType: "selectionExtract",
          note,
        });
      };
    } else {
      quickPick.selectionProcessFunc = undefined;
    }
  }

  private onSelection2LinkBtnToggled(enabled: boolean) {
    const quickPick = this._quickPick!;
    if (enabled) {
      quickPick.selectionProcessFunc = (note: NoteProps) => {
        return this.selectionToNoteProps({
          selectionType: "selection2link",
          note,
        });
      };

      quickPick.prevValue = quickPick.value;
      const { text } = VSCodeUtils.getSelection();
      const slugger = getSlugger();
      quickPick.selectionModifierValue = slugger.slug(text!);
      if (quickPick.noteModifierValue || quickPick.prefix) {
        quickPick.value = NotePickerUtils.getPickerValue(quickPick);
      } else {
        quickPick.value = [
          quickPick.rawValue,
          NotePickerUtils.getPickerValue(quickPick),
        ].join(".");
      }
      return;
    } else {
      quickPick.selectionProcessFunc = undefined;
      quickPick.selectionModifierValue = undefined;
      quickPick.value = NotePickerUtils.getPickerValue(quickPick);
      return;
    }
  }

  private async selectionToNoteProps(opts: {
    selectionType: string;
    note: NoteProps;
  }) {
    const ext = ExtensionProvider.getExtension();
    const resp = await VSCodeUtils.extractRangeFromActiveEditor();
    const { document, range } = resp || {};
    const { selectionType, note } = opts;
    const { selection, text } = VSCodeUtils.getSelection();

    switch (selectionType) {
      case "selectionExtract": {
        if (!_.isUndefined(document)) {
          const ws = ExtensionProvider.getDWorkspace();
          const lookupConfig = ConfigUtils.getCommands(ws.config).lookup;
          const noteLookupConfig = lookupConfig.note;
          const leaveTrace = noteLookupConfig.leaveTrace || false;
          const body = "\n" + document.getText(range).trim();
          note.body = body;
          const { wsRoot, vaults } = ext.getDWorkspace();
          // don't delete if original file is not in workspace
          if (
            !WorkspaceUtils.isPathInWorkspace({
              wsRoot,
              vaults,
              fpath: document.uri.fsPath,
            })
          ) {
            return note;
          }
          if (leaveTrace) {
            const editor = VSCodeUtils.getActiveTextEditor();
            const link = NoteUtils.createWikiLink({
              note,
              useVaultPrefix: DendronClientUtilsV2.shouldUseVaultPrefix(
                ExtensionProvider.getEngine()
              ),
              alias: { mode: "title" },
            });
            await editor?.edit((builder) => {
              if (!_.isUndefined(selection) && !selection.isEmpty) {
                builder.replace(selection, `!${link}`);
              }
            });
          } else {
            await VSCodeUtils.deleteRange(document, range as vscode.Range);
          }
        }
        return note;
      }
      case "selection2link": {
        if (!_.isUndefined(document)) {
          const editor = VSCodeUtils.getActiveTextEditor();
          if (editor) {
            await editor.edit((builder) => {
              const link = note.fname;
              if (!_.isUndefined(selection) && !selection.isEmpty) {
                builder.replace(selection, `[[${text}|${link}]]`);
              }
            });
          }
        }
        return note;
      }
      default: {
        return note;
      }
    }
  }
}
