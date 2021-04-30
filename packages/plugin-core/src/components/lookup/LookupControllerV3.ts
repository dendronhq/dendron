import { DendronError, DNodeType } from "@dendronhq/common-all";
import _ from "lodash";
import { QuickInputButton } from "vscode";
import { CancellationTokenSource } from "vscode-languageclient";
import { VSCodeUtils } from "../../utils";
import { getWS } from "../../workspace";
import {
  DendronBtn,
  IDendronQuickInputButton,
  VaultSelectButton,
} from "./buttons";
import { ILookupProviderV3 } from "./LookupProviderV3";
import { DendronQuickPickerV2, LookupControllerState } from "./types";
import { CreateQuickPickOpts, NotePickerUtils, PickerUtilsV2 } from "./utils";

export type LookupControllerV3CreateOpts = {
  buttons?: DendronBtn[];
  disableVaultSelection?: boolean;
};

export class LookupControllerV3 {
  public state: LookupControllerState;
  public nodeType: DNodeType;
  protected _cancelTokenSource?: CancellationTokenSource;
  public quickpick?: DendronQuickPickerV2;

  static create(opts?: LookupControllerV3CreateOpts) {
    const vaults = getWS().getEngine().vaults;
    const disableVaultSelection =
      _.isBoolean(opts?.disableVaultSelection) && opts?.disableVaultSelection;
    const isMultiVault = vaults.length > 1 && !disableVaultSelection;
    const buttons = opts?.buttons || [VaultSelectButton.create(isMultiVault)];
    return new LookupControllerV3({ nodeType: "note", buttons });
  }

  constructor(opts: { nodeType: DNodeType; buttons: DendronBtn[] }) {
    const { buttons, nodeType } = opts;
    this.nodeType = nodeType;
    this.state = {
      buttons,
      buttonsPrev: [],
    };
    this._cancelTokenSource = VSCodeUtils.createCancelSource();
  }

  get cancelToken() {
    if (_.isUndefined(this._cancelTokenSource)) {
      throw new DendronError({ msg: "no cancel token" });
    }
    return this._cancelTokenSource;
  }

  createCancelSource() {
    const tokenSource = new CancellationTokenSource();
    if (this._cancelTokenSource) {
      this._cancelTokenSource.cancel();
      this._cancelTokenSource.dispose();
    }
    this._cancelTokenSource = tokenSource;
    return tokenSource;
  }

  async show(
    opts: CreateQuickPickOpts & {
      nonInteractive?: boolean;
      initialValue?: string;
      provider: ILookupProviderV3;
    }
  ) {
    const cancelToken = this.createCancelSource();
    const { nonInteractive, initialValue, provider } = _.defaults(opts, {
      nonInteractive: false,
    });
    const { buttonsPrev, buttons } = this.state;
    const quickpick = PickerUtilsV2.createDendronQuickPick(opts);
    this.quickpick = quickpick;
    PickerUtilsV2.refreshButtons({ quickpick, buttons, buttonsPrev });
    await PickerUtilsV2.refreshPickerBehavior({ quickpick, buttons });
    quickpick.onDidTriggerButton(this.onTriggerButton);
    quickpick.onDidHide(this.onHide);
    if (initialValue) {
      quickpick.value = initialValue;
    }
    provider.provide(this);
    if (!nonInteractive) {
      provider.onUpdatePickerItems({
        picker: quickpick,
        token: cancelToken.token,
      });
      quickpick.show();
    } else {
      // FIXME: this always get first item
      quickpick.items = [
        NotePickerUtils.createNoActiveItem(
          PickerUtilsV2.getVaultForOpenEditor()
        ),
      ];
      quickpick.selectedItems = quickpick.items;
      await provider.onDidAccept({ quickpick, lc: this })();
    }
  }

  onHide() {
    const { quickpick } = this;
    if (!quickpick) {
      return;
    }
    quickpick.dispose();
    this.quickpick = undefined;
    this._cancelTokenSource?.dispose();
  }

  onTriggerButton = async (btn: QuickInputButton) => {
    const { quickpick } = this;
    const { buttons, buttonsPrev } = this.state;
    if (!quickpick) {
      return;
    }
    const btnType = (btn as IDendronQuickInputButton).type;
    const btnTriggered = _.find(this.state.buttons, {
      type: btnType,
    }) as DendronBtn;
    btnTriggered.pressed = !btnTriggered.pressed;
    PickerUtilsV2.refreshButtons({ quickpick, buttons, buttonsPrev });
    await PickerUtilsV2.refreshPickerBehavior({ quickpick, buttons });
  };
}
