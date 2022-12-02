import {
  DNodeType,
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
} from "@dendronhq/common-all";
import _ from "lodash";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { TwoWayBinding } from "../../utils/TwoWayBinding";
import { VaultSelectButton } from "./buttons";
import { LookupControllerV3 } from "./LookupControllerV3";
import {
  ILookupControllerV3,
  ILookupControllerV3Factory,
  LookupControllerV3CreateOpts,
} from "./LookupControllerV3Interface";
import { VaultSelectionMode } from "./types";

export class LookupControllerV3Factory implements ILookupControllerV3Factory {
  private extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this.extension = extension;
  }

  async create(
    opts?: LookupControllerV3CreateOpts
  ): Promise<ILookupControllerV3> {
    const vaults = await this.extension.getDWorkspace().vaults;

    // disable vault selection if explicitly requested or we are looking at schemas
    const disableVaultSelection =
      (_.isBoolean(opts?.disableVaultSelection) &&
        opts?.disableVaultSelection) ||
      opts?.nodeType === "schema";

    // --- start: multi vault selection check
    const isMultiVault = vaults.length > 1 && !disableVaultSelection;
    // should vault toggle be pressed?
    const maybeVaultSelectButtonPressed = _.isUndefined(
      opts?.vaultButtonPressed
    )
      ? isMultiVault
      : isMultiVault && opts!.vaultButtonPressed;

    const maybeVaultSelectButton =
      opts?.nodeType === "note" && isMultiVault
        ? [
            VaultSelectButton.create({
              pressed: maybeVaultSelectButtonPressed,
              canToggle: opts?.vaultSelectCanToggle,
            }),
          ]
        : [];
    // --- end: multi vault selection check
    const buttons = opts?.buttons || maybeVaultSelectButton;
    const extraButtons = opts?.extraButtons || [];

    const viewModel = {
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

    return new LookupControllerV3({
      nodeType: opts?.nodeType as DNodeType,
      fuzzThreshold: opts?.fuzzThreshold,
      buttons: buttons.concat(extraButtons),
      enableLookupView: opts?.enableLookupView,
      title: opts?.title,
      viewModel,
    });
  }
}
