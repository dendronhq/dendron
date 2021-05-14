import { DendronError, DNodeType, ERROR_STATUS } from "@dendronhq/common-all";
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
import {
  CreateQuickPickOpts,
  PickerUtilsV2,
  PrepareQuickPickOpts,
  ShowQuickPickOpts,
} from "./utils";

export type LookupControllerV3CreateOpts = {
  /**
   * Replace default buttons
   */
  buttons?: DendronBtn[];
  /**
   * When true, don't enable vault selection
   */
  disableVaultSelection?: boolean;
  /**
   * Additional buttons
   */
  extraButtons?: DendronBtn[];
  /**
   * 0.0 = exact match
   * 1.0 = match anything
   */
  fuzzThreshold?: number;
};

export class LookupControllerV3 {
  public state: LookupControllerState;
  public nodeType: DNodeType;
  protected _cancelTokenSource?: CancellationTokenSource;
  public _quickpick?: DendronQuickPickerV2;
  public fuzzThreshold: number;

  static create(opts?: LookupControllerV3CreateOpts) {
    const vaults = getWS().getEngine().vaults;
    const disableVaultSelection =
      _.isBoolean(opts?.disableVaultSelection) && opts?.disableVaultSelection;
    const isMultiVault = vaults.length > 1 && !disableVaultSelection;
    const buttons = opts?.buttons || [VaultSelectButton.create(isMultiVault)];
    const extraButtons = opts?.extraButtons || [];
    return new LookupControllerV3({
      nodeType: "note",
      fuzzThreshold: opts?.fuzzThreshold,
      buttons: buttons.concat(extraButtons),
    });
  }

  constructor(opts: {
    nodeType: DNodeType;
    buttons: DendronBtn[];
    fuzzThreshold?: number;
  }) {
    const { buttons, nodeType } = opts;
    this.nodeType = nodeType;
    this.state = {
      buttons,
      buttonsPrev: [],
    };
    this.fuzzThreshold = opts.fuzzThreshold || 0.6;
    this._cancelTokenSource = VSCodeUtils.createCancelSource();
  }

  get quickpick(): DendronQuickPickerV2 {
    if (_.isUndefined(this._quickpick)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "quickpick not initialized",
      });
    }
    return this._quickpick;
  }

  get cancelToken() {
    if (_.isUndefined(this._cancelTokenSource)) {
      throw new DendronError({ message: "no cancel token" });
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

  /**
   * Wire up quickpick and initialize buttons
   */
  async prepareQuickPick(opts: PrepareQuickPickOpts) {
    const { provider } = _.defaults(opts, {
      nonInteractive: false,
    });
    const { buttonsPrev, buttons } = this.state;
    const quickpick = PickerUtilsV2.createDendronQuickPick(opts);
    this._quickpick = quickpick;
    PickerUtilsV2.refreshButtons({ quickpick, buttons, buttonsPrev });
    await PickerUtilsV2.refreshPickerBehavior({ quickpick, buttons });
    quickpick.onDidTriggerButton(this.onTriggerButton);
    quickpick.onDidHide(this.onHide);
    provider.provide(this);
    return { quickpick };
  }

  async showQuickPick(opts: ShowQuickPickOpts) {
    const cancelToken = this.createCancelSource();
    const { nonInteractive, provider, quickpick } = _.defaults(opts, {
      nonInteractive: false,
    });
    await provider.onUpdatePickerItems({
      picker: quickpick,
      token: cancelToken.token,
      fuzzThreshold: this.fuzzThreshold,
    });
    if (!nonInteractive) {
      quickpick.show();
    } else {
      quickpick.selectedItems = quickpick.items;
      await provider.onDidAccept({ quickpick, lc: this })();
    }
    return quickpick;
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
  ) {
    const { quickpick } = await this.prepareQuickPick(opts);
    return this.showQuickPick({ ...opts, quickpick });
  }

  onHide() {
    const { _quickpick: quickpick } = this;
    if (!quickpick) {
      return;
    }
    quickpick.dispose();
    this._quickpick = undefined;
    this._cancelTokenSource?.dispose();
  }

  onTriggerButton = async (btn: QuickInputButton) => {
    const { _quickpick: quickpick } = this;
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
