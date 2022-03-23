import {
  assertUnreachable,
  LookupEvents,
  LookupNoteTypeEnum,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Disposable, QuickInputButton } from "vscode";
import { AnalyticsUtils } from "../../utils/analytics";
import {
  ButtonType,
  DendronBtn,
  IDendronQuickInputButton,
  LookupSelectionTypeEnum,
} from "../lookup/ButtonTypes";
import {
  ILookupViewModel,
  NameModifierMode,
  SelectionMode,
} from "../lookup/LookupViewModel";
import { DendronQuickPickerV2, VaultSelectionMode } from "../lookup/types";

/**
 * A 'view' that represents the UI state of the Lookup Quick Pick. This
 * essentially controls the button state of the quick pick and reacts upon user
 * mouse clicks to the buttons.
 */
export class LookupV3QuickPickView implements Disposable {
  private _quickPick: DendronQuickPickerV2;
  private _viewState: ILookupViewModel;
  private _disposables: Disposable[];
  private _providerId?: string;

  constructor(
    quickPick: DendronQuickPickerV2,
    viewModel: ILookupViewModel,
    providerId?: string // For telemetry purposes only
  ) {
    this._quickPick = quickPick;
    this._viewState = viewModel;
    this._providerId = providerId;
    this._disposables = [];

    this.setupViewModel();

    this._disposables.push(
      this._quickPick.onDidTriggerButton(this.onTriggerButton)
    );
  }
  dispose() {
    this._disposables.forEach((callback) => callback.dispose());
  }

  private setupViewModel(): void {
    const ToLinkBtn = this.getButton("selection2link");
    const ExtractBtn = this.getButton("selectionExtract");
    const ToItemsBtn = this.getButton("selection2Items");

    this._disposables.push(
      this._viewState.selectionState.bind(async (newValue) => {
        switch (newValue) {
          case SelectionMode.selection2Items: {
            if (ToLinkBtn) ToLinkBtn.pressed = false;
            if (ExtractBtn) ExtractBtn.pressed = false;
            if (ToItemsBtn) ToItemsBtn.pressed = true;
            break;
          }

          case SelectionMode.selection2Link: {
            if (ToLinkBtn) ToLinkBtn.pressed = true;
            if (ExtractBtn) ExtractBtn.pressed = false;
            if (ToItemsBtn) ToItemsBtn.pressed = false;
            break;
          }
          case SelectionMode.selectionExtract: {
            if (ToLinkBtn) ToLinkBtn.pressed = false;
            if (ExtractBtn) ExtractBtn.pressed = true;
            if (ToItemsBtn) ToItemsBtn.pressed = false;
            break;
          }
          case SelectionMode.None: {
            if (ToLinkBtn) ToLinkBtn.pressed = false;
            if (ExtractBtn) ExtractBtn.pressed = false;
            if (ToItemsBtn) ToItemsBtn.pressed = false;
            break;
          }
          default:
            assertUnreachable(newValue);
        }

        const buttons: DendronBtn[] = [];

        if (ToLinkBtn) buttons.push(ToLinkBtn);
        if (ExtractBtn) buttons.push(ExtractBtn);
        if (ToItemsBtn) buttons.push(ToItemsBtn);

        this.updateButtonsOnQuickPick(...buttons);
      })
    );

    // Vault Selection is mapped to 'other' for some reason; Fix Later.
    const vaultSelectionBtn = this.getButton("other");
    if (vaultSelectionBtn !== undefined) {
      this._disposables.push(
        this._viewState.vaultSelectionMode.bind(async (newValue) => {
          vaultSelectionBtn.pressed =
            newValue === VaultSelectionMode.alwaysPrompt;
          this.updateButtonsOnQuickPick(vaultSelectionBtn);
        })
      );
    }

    const multiSelectBtn = this.getButton("multiSelect");
    if (multiSelectBtn) {
      this._disposables.push(
        this._viewState.isMultiSelectEnabled.bind(async (newValue) => {
          multiSelectBtn.pressed = newValue;
          this.updateButtonsOnQuickPick(multiSelectBtn);
        })
      );
    }

    const copyLinkBtn = this.getButton("copyNoteLink");
    if (copyLinkBtn) {
      this._disposables.push(
        this._viewState.isCopyNoteLinkEnabled.bind(async (enabled) => {
          copyLinkBtn.pressed = enabled;
          this.updateButtonsOnQuickPick(copyLinkBtn);
        })
      );
    }

    const directChildBtn = this.getButton("directChildOnly");
    if (directChildBtn) {
      this._disposables.push(
        this._viewState.isApplyDirectChildFilter.bind(async (newValue) => {
          directChildBtn.pressed = newValue;
          this.updateButtonsOnQuickPick(directChildBtn);
        })
      );
    }

    const journalBtn = this.getButton(LookupNoteTypeEnum.journal);
    const scratchBtn = this.getButton(LookupNoteTypeEnum.scratch);
    const taskBtn = this.getButton(LookupNoteTypeEnum.task);

    if (journalBtn && scratchBtn && taskBtn) {
      this._disposables.push(
        this._viewState.nameModifierMode.bind(async (newValue) => {
          switch (newValue) {
            case NameModifierMode.Journal:
              journalBtn.pressed = true;
              scratchBtn.pressed = false;
              taskBtn.pressed = false;
              break;

            case NameModifierMode.Scratch:
              journalBtn.pressed = false;
              scratchBtn.pressed = true;
              taskBtn.pressed = false;
              break;

            case NameModifierMode.Task:
              journalBtn.pressed = false;
              scratchBtn.pressed = false;
              taskBtn.pressed = true;
              break;

            case NameModifierMode.None:
              journalBtn.pressed = false;
              scratchBtn.pressed = false;
              taskBtn.pressed = false;
              break;

            default:
              assertUnreachable(newValue);
          }

          this.updateButtonsOnQuickPick(journalBtn, scratchBtn, taskBtn);
        })
      );
    }

    const horizontalBtn = this.getButton("horizontal");
    if (horizontalBtn) {
      this._disposables.push(
        this._viewState.isSplitHorizontally.bind(async (splitHorizontally) => {
          horizontalBtn.pressed = splitHorizontally;

          this.updateButtonsOnQuickPick(horizontalBtn);
        })
      );
    }
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

  private updateButtonsOnQuickPick(...btns: DendronBtn[]): void {
    const newButtons = this._quickPick!.buttons.map((b: DendronBtn) => {
      const toUpdate = _.find(btns, (value) => value.type === b.type);

      if (toUpdate) {
        return toUpdate;
      } else {
        return b.clone();
      }
    });
    this._quickPick!.buttons = newButtons;
  }

  private onTriggerButton = (btn: QuickInputButton) => {
    const btnType = (btn as IDendronQuickInputButton).type;

    switch (btnType) {
      case LookupSelectionTypeEnum.selection2Items:
        this._viewState.selectionState.value =
          this._viewState.selectionState.value === SelectionMode.selection2Items
            ? SelectionMode.None
            : SelectionMode.selection2Items;
        break;

      case LookupSelectionTypeEnum.selection2link:
        this._viewState.selectionState.value =
          this._viewState.selectionState.value === SelectionMode.selection2Link
            ? SelectionMode.None
            : SelectionMode.selection2Link;
        break;

      case LookupSelectionTypeEnum.selectionExtract:
        this._viewState.selectionState.value =
          this._viewState.selectionState.value ===
          SelectionMode.selectionExtract
            ? SelectionMode.None
            : SelectionMode.selectionExtract;
        break;
      case "other": {
        this._viewState.vaultSelectionMode.value =
          this._viewState.vaultSelectionMode.value ===
          VaultSelectionMode.alwaysPrompt
            ? VaultSelectionMode.smart // TODO: This needs to reflect settings.
            : VaultSelectionMode.alwaysPrompt;
        break;
      }
      case "multiSelect": {
        this._viewState.isMultiSelectEnabled.value =
          !this._viewState.isMultiSelectEnabled.value;
        break;
      }
      case "copyNoteLink": {
        this._viewState.isCopyNoteLinkEnabled.value =
          !this._viewState.isCopyNoteLinkEnabled.value;
        break;
      }
      case "directChildOnly": {
        this._viewState.isApplyDirectChildFilter.value =
          !this._viewState.isApplyDirectChildFilter.value;
        break;
      }
      case LookupNoteTypeEnum.journal: {
        this._viewState.nameModifierMode.value =
          this._viewState.nameModifierMode.value === NameModifierMode.Journal
            ? NameModifierMode.None
            : NameModifierMode.Journal;
        break;
      }
      case LookupNoteTypeEnum.scratch: {
        this._viewState.nameModifierMode.value =
          this._viewState.nameModifierMode.value === NameModifierMode.Scratch
            ? NameModifierMode.None
            : NameModifierMode.Scratch;
        break;
      }
      case LookupNoteTypeEnum.task: {
        this._viewState.nameModifierMode.value =
          this._viewState.nameModifierMode.value === NameModifierMode.Task
            ? NameModifierMode.None
            : NameModifierMode.Task;
        break;
      }
      case "horizontal": {
        this._viewState.isSplitHorizontally.value =
          !this._viewState.isSplitHorizontally.value;
        break;
      }
      default:
        break;
    }

    AnalyticsUtils.track(LookupEvents.LookupModifierToggledByUser, {
      command: this._providerId,
      type: (btn as IDendronQuickInputButton).type,
      pressed: (btn as IDendronQuickInputButton).pressed,
    });
  };
}
