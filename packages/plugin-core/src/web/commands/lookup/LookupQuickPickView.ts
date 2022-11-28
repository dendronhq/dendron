import {
  assertUnreachable,
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
  NoteQuickInputV2,
} from "@dendronhq/common-all";
import _ from "lodash";
import {
  DendronWebQuickPick,
  VaultSelectionMode,
} from "../../../components/lookup/types";
import { Disposable, QuickInputButton } from "vscode";
import { ILookupViewModel } from "../../../components/lookup/LookupViewModel";
import {
  DendronBtn,
  IDendronQuickInputButton,
} from "../../../components/lookup/ButtonTypes";
import { NoteLookupUtilsWeb } from "../../utils/NoteLookupUtilsWeb";

/**
 * A 'view' that represents the UI state of the Lookup Quick Pick. This
 * essentially controls the button state of the quick pick and reacts upon user
 * mouse clicks to the buttons.
 */
export class LookupQuickPickView implements Disposable {
  private _quickPick: DendronWebQuickPick<NoteQuickInputV2>;
  private _viewState: ILookupViewModel;
  private _disposables: Disposable[];

  constructor(
    quickPick: DendronWebQuickPick<NoteQuickInputV2>,
    viewModel: ILookupViewModel,
    private lookupUtils: NoteLookupUtilsWeb
  ) {
    this._quickPick = quickPick;
    this._viewState = viewModel;
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
    const ToLinkBtn = this.lookupUtils.getButton(
      "selection2link",
      this._quickPick.buttons
    );
    const ExtractBtn = this.lookupUtils.getButton(
      "selectionExtract",
      this._quickPick.buttons
    );
    const ToItemsBtn = this.lookupUtils.getButton(
      "selection2Items",
      this._quickPick.buttons
    );

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

    const vaultSelectionBtn = this.lookupUtils.getButton(
      "selectVault",
      this._quickPick.buttons
    );
    if (vaultSelectionBtn !== undefined) {
      this._disposables.push(
        this._viewState.vaultSelectionMode.bind(async (newValue) => {
          vaultSelectionBtn.pressed =
            newValue === VaultSelectionMode.alwaysPrompt;
          this.updateButtonsOnQuickPick(vaultSelectionBtn);
        })
      );
    }

    const multiSelectBtn = this.lookupUtils.getButton(
      "multiSelect",
      this._quickPick.buttons
    );
    if (multiSelectBtn) {
      this._disposables.push(
        this._viewState.isMultiSelectEnabled.bind(async (newValue) => {
          multiSelectBtn.pressed = newValue;
          this.updateButtonsOnQuickPick(multiSelectBtn);
        })
      );
    }

    const copyLinkBtn = this.lookupUtils.getButton(
      "copyNoteLink",
      this._quickPick.buttons
    );
    if (copyLinkBtn) {
      this._disposables.push(
        this._viewState.isCopyNoteLinkEnabled.bind(async (enabled) => {
          copyLinkBtn.pressed = enabled;
          this.updateButtonsOnQuickPick(copyLinkBtn);
        })
      );
    }

    const directChildBtn = this.lookupUtils.getButton(
      "directChildOnly",
      this._quickPick.buttons
    );
    if (directChildBtn) {
      this._disposables.push(
        this._viewState.isApplyDirectChildFilter.bind(async (newValue) => {
          directChildBtn.pressed = newValue;
          this.updateButtonsOnQuickPick(directChildBtn);
        })
      );
    }

    const journalBtn = this.lookupUtils.getButton(
      LookupNoteTypeEnum.journal,
      this._quickPick.buttons
    );
    const scratchBtn = this.lookupUtils.getButton(
      LookupNoteTypeEnum.scratch,
      this._quickPick.buttons
    );
    const taskBtn = this.lookupUtils.getButton(
      LookupNoteTypeEnum.task,
      this._quickPick.buttons
    );

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

    const horizontalBtn = this.lookupUtils.getButton(
      "horizontal",
      this._quickPick.buttons
    );
    if (horizontalBtn) {
      this._disposables.push(
        this._viewState.isSplitHorizontally.bind(async (splitHorizontally) => {
          horizontalBtn.pressed = splitHorizontally;

          this.updateButtonsOnQuickPick(horizontalBtn);
        })
      );
    }
  }

  private updateButtonsOnQuickPick(...btns: DendronBtn[]): void {
    const newButtons = this._quickPick!.buttons.map((b: DendronBtn) => {
      //@ts-ignore
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
          this.lookupUtils.getButton(
            LookupSelectionTypeEnum.selection2Items,
            this._quickPick.buttons
          )?.canToggle
        ) {
          this._viewState.selectionState.value =
            this._viewState.selectionState.value ===
            LookupSelectionTypeEnum.selection2Items
              ? LookupSelectionTypeEnum.none
              : LookupSelectionTypeEnum.selection2Items;
        }
        break;

      case LookupSelectionTypeEnum.selection2link:
        if (
          this.lookupUtils.getButton(
            LookupSelectionTypeEnum.selection2link,
            this._quickPick.buttons
          )?.canToggle
        ) {
          this._viewState.selectionState.value =
            this._viewState.selectionState.value ===
            LookupSelectionTypeEnum.selection2link
              ? LookupSelectionTypeEnum.none
              : LookupSelectionTypeEnum.selection2link;
        }
        break;

      case LookupSelectionTypeEnum.selectionExtract:
        if (
          this.lookupUtils.getButton(
            LookupSelectionTypeEnum.selectionExtract,
            this._quickPick.buttons
          )?.canToggle
        ) {
          this._viewState.selectionState.value =
            this._viewState.selectionState.value ===
            LookupSelectionTypeEnum.selectionExtract
              ? LookupSelectionTypeEnum.none
              : LookupSelectionTypeEnum.selectionExtract;
        }
        break;
      case "selectVault": {
        if (
          this.lookupUtils.getButton("selectVault", this._quickPick.buttons)
            ?.canToggle
        ) {
          this._viewState.vaultSelectionMode.value =
            this._viewState.vaultSelectionMode.value ===
            VaultSelectionMode.alwaysPrompt
              ? VaultSelectionMode.smart
              : VaultSelectionMode.alwaysPrompt;
        }
        break;
      }
      case "multiSelect": {
        if (
          this.lookupUtils.getButton("multiSelect", this._quickPick.buttons)
            ?.canToggle
        ) {
          this._viewState.isMultiSelectEnabled.value =
            !this._viewState.isMultiSelectEnabled.value;
        }
        break;
      }
      case "copyNoteLink": {
        if (
          this.lookupUtils.getButton("copyNoteLink", this._quickPick.buttons)
            ?.canToggle
        ) {
          this._viewState.isCopyNoteLinkEnabled.value =
            !this._viewState.isCopyNoteLinkEnabled.value;
        }
        break;
      }
      case "directChildOnly": {
        if (
          this.lookupUtils.getButton("directChildOnly", this._quickPick.buttons)
            ?.canToggle
        ) {
          this._viewState.isApplyDirectChildFilter.value =
            !this._viewState.isApplyDirectChildFilter.value;
        }
        break;
      }
      case LookupNoteTypeEnum.journal: {
        if (
          this.lookupUtils.getButton(
            LookupNoteTypeEnum.journal,
            this._quickPick.buttons
          )?.canToggle
        ) {
          this._viewState.nameModifierMode.value =
            this._viewState.nameModifierMode.value ===
            LookupNoteTypeEnum.journal
              ? LookupNoteTypeEnum.none
              : LookupNoteTypeEnum.journal;
        }
        break;
      }
      case LookupNoteTypeEnum.scratch: {
        if (
          this.lookupUtils.getButton(
            LookupNoteTypeEnum.scratch,
            this._quickPick.buttons
          )?.canToggle
        ) {
          this._viewState.nameModifierMode.value =
            this._viewState.nameModifierMode.value ===
            LookupNoteTypeEnum.scratch
              ? LookupNoteTypeEnum.none
              : LookupNoteTypeEnum.scratch;
        }
        break;
      }
      case LookupNoteTypeEnum.task: {
        if (
          this.lookupUtils.getButton(
            LookupNoteTypeEnum.task,
            this._quickPick.buttons
          )?.canToggle
        ) {
          this._viewState.nameModifierMode.value =
            this._viewState.nameModifierMode.value === LookupNoteTypeEnum.task
              ? LookupNoteTypeEnum.none
              : LookupNoteTypeEnum.task;
        }
        break;
      }
      case "horizontal": {
        if (
          this.lookupUtils.getButton("horizontal", this._quickPick.buttons)
            ?.canToggle
        ) {
          this._viewState.isSplitHorizontally.value =
            !this._viewState.isSplitHorizontally.value;
        }
        break;
      }
      default:
        break;
    }
  };
}
