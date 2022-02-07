import {
  ILookupControllerV3,
  ILookupControllerV3Factory,
  LookupControllerV3CreateOpts,
} from "./LookupControllerV3Interface";
import _ from "lodash";
import { VaultSelectButton } from "./buttons";
import { DNodeType } from "@dendronhq/common-all";
import { LookupControllerV3 } from "./LookupControllerV3";
import { IDendronExtension } from "../../dendronExtensionInterface";

export class LookupControllerV3Factory implements ILookupControllerV3Factory {
  private extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this.extension = extension;
  }

  create(opts?: LookupControllerV3CreateOpts): ILookupControllerV3 {
    const { vaults } = this.extension.getDWorkspace();

    const disableVaultSelection =
      (_.isBoolean(opts?.disableVaultSelection) &&
        opts?.disableVaultSelection) ||
      opts?.nodeType === "schema";
    const isMultiVault = vaults.length > 1 && !disableVaultSelection;
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
    const buttons = opts?.buttons || maybeVaultSelectButton;
    const extraButtons = opts?.extraButtons || [];

    return new LookupControllerV3({
      nodeType: opts?.nodeType as DNodeType,
      fuzzThreshold: opts?.fuzzThreshold,
      buttons: buttons.concat(extraButtons),
      disableLookupView: opts?.disableLookupView,
    });
  }
}
