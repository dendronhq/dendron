import {
  assertUnreachable,
  LookupEvents,
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Disposable, QuickInputButton } from "vscode";
import { AnalyticsUtils } from "../../utils/analytics";
import {
  ButtonType,
  DendronBtn,
  IDendronQuickInputButton,
} from "../lookup/ButtonTypes";
import { ILookupViewModel } from "../lookup/LookupViewModel";
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
          case LookupSelectionTypeEnum.selection2Items: {
            if (ToLinkBtn) ToLinkBtn.pressed = false;
            if (ExtractBtn) ExtractBtn.pressed = false;
            if (ToItemsBtn) ToItemsBtn.pressed = true;
            break;
          }

          case LookupSelectionTypeEnum.selection2link: {
            if (ToLinkBtn) ToLinkBtn.pressed = true;
            if (ExtractBtn) ExtractBtn.pressed = false;
            if (ToItemsBtn) ToItemsBtn.pressed = false;
            break;
          }
          case LookupSelectionTypeEnum.selectionExtract: {
            if (ToLinkBtn) ToLinkBtn.pressed = false;
            if (ExtractBtn) ExtractBtn.pressed = true;
            if (ToItemsBtn) ToItemsBtn.pressed = false;
            break;
          }
          case LookupSelectionTypeEnum.none: {
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

    const vaultSelectionBtn = this.getButton("selectVault");
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

    this._disposables.push(
      this._viewState.nameModifierMode.bind(async (newValue) => {
        switch (newValue) {
          case LookupNoteTypeEnum.journal:
            if (journalBtn) journalBtn.pressed = true;
            if (scratchBtn) scratchBtn.pressed = false;
            if (taskBtn) taskBtn.pressed = false;
            break;

          case LookupNoteTypeEnum.scratch:
            if (journalBtn) journalBtn.pressed = false;
            if (scratchBtn) scratchBtn.pressed = true;
            if (taskBtn) taskBtn.pressed = false;
            break;

          case LookupNoteTypeEnum.task:
            if (journalBtn) journalBtn.pressed = false;
            if (scratchBtn) scratchBtn.pressed = false;
            if (taskBtn) taskBtn.pressed = true;
            break;

          case LookupNoteTypeEnum.none:
            if (journalBtn) journalBtn.pressed = false;
            if (scratchBtn) scratchBtn.pressed = false;
            if (taskBtn) taskBtn.pressed = false;
            break;

          default:
            assertUnreachable(newValue);
        }

        const validButtons: DendronBtn[] = [];

        if (journalBtn) validButtons.push(journalBtn);
        if (scratchBtn) validButtons.push(scratchBtn);
        if (taskBtn) validButtons.push(taskBtn);

        this.updateButtonsOnQuickPick(...validButtons);
      })
    );

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
        if (
          this.getButton(LookupSelectionTypeEnum.selection2Items)?.canToggle
        ) {
          this._viewState.selectionState.value =
            this._viewState.selectionState.value ===
            LookupSelectionTypeEnum.selection2Items
              ? LookupSelectionTypeEnum.none
              : LookupSelectionTypeEnum.selection2Items;
        }
        break;

      case LookupSelectionTypeEnum.selection2link:
        if (this.getButton(LookupSelectionTypeEnum.selection2link)?.canToggle) {
          this._viewState.selectionState.value =
            this._viewState.selectionState.value ===
            LookupSelectionTypeEnum.selection2link
              ? LookupSelectionTypeEnum.none
              : LookupSelectionTypeEnum.selection2link;
        }
        break;

      case LookupSelectionTypeEnum.selectionExtract:
        if (
          this.getButton(LookupSelectionTypeEnum.selectionExtract)?.canToggle
        ) {
          this._viewState.selectionState.value =
            this._viewState.selectionState.value ===
            LookupSelectionTypeEnum.selectionExtract
              ? LookupSelectionTypeEnum.none
              : LookupSelectionTypeEnum.selectionExtract;
        }
        break;
      case "selectVault": {
        if (this.getButton("selectVault")?.canToggle) {
          this._viewState.vaultSelectionMode.value =
            this._viewState.vaultSelectionMode.value ===
            VaultSelectionMode.alwaysPrompt
              ? VaultSelectionMode.smart
              : VaultSelectionMode.alwaysPrompt;
        }
        break;
      }
      case "multiSelect": {
        if (this.getButton("multiSelect")?.canToggle) {
          this._viewState.isMultiSelectEnabled.value =
            !this._viewState.isMultiSelectEnabled.value;
        }
        break;
      }
      case "copyNoteLink": {
        if (this.getButton("copyNoteLink")?.canToggle) {
          this._viewState.isCopyNoteLinkEnabled.value =
            !this._viewState.isCopyNoteLinkEnabled.value;
        }
        break;
      }
      case "directChildOnly": {
        if (this.getButton("directChildOnly")?.canToggle) {
          this._viewState.isApplyDirectChildFilter.value =
            !this._viewState.isApplyDirectChildFilter.value;
        }
        break;
      }
      case LookupNoteTypeEnum.journal: {
        if (this.getButton(LookupNoteTypeEnum.journal)?.canToggle) {
          this._viewState.nameModifierMode.value =
            this._viewState.nameModifierMode.value ===
            LookupNoteTypeEnum.journal
              ? LookupNoteTypeEnum.none
              : LookupNoteTypeEnum.journal;
        }
        break;
      }
      case LookupNoteTypeEnum.scratch: {
        if (this.getButton(LookupNoteTypeEnum.scratch)?.canToggle) {
          this._viewState.nameModifierMode.value =
            this._viewState.nameModifierMode.value ===
            LookupNoteTypeEnum.scratch
              ? LookupNoteTypeEnum.none
              : LookupNoteTypeEnum.scratch;
        }
        break;
      }
      case LookupNoteTypeEnum.task: {
        if (this.getButton(LookupNoteTypeEnum.task)?.canToggle) {
          this._viewState.nameModifierMode.value =
            this._viewState.nameModifierMode.value === LookupNoteTypeEnum.task
              ? LookupNoteTypeEnum.none
              : LookupNoteTypeEnum.task;
        }
        break;
      }
      case "horizontal": {
        if (this.getButton("horizontal")?.canToggle) {
          this._viewState.isSplitHorizontally.value =
            !this._viewState.isSplitHorizontally.value;
        }
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
