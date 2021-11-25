import {
  DendronError,
  DNodeType,
  ERROR_STATUS,
  LookupEvents,
} from "@dendronhq/common-all";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import { QuickInputButton } from "vscode";
import { CancellationTokenSource } from "vscode-languageclient";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../utils";
import { AnalyticsUtils } from "../../utils/analytics";
import { DendronExtension, getDWorkspace } from "../../workspace";
import {
  ButtonCategory,
  DendronBtn,
  getButtonCategory,
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
   * Node type
   */
  nodeType: string;
  /**
   * Replace default buttons
   */
  buttons?: DendronBtn[];
  /**
   * When true, don't enable vault selection
   */
  disableVaultSelection?: boolean;
  /**
   * if vault selection isn't disabled,
   * press button on init if true
   */
  vaultButtonPressed?: boolean;
  /** If vault selection isn't disabled, allow choosing the mode of selection.
   *  Defaults to true. */
  vaultSelectCanToggle?: boolean;
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
  public _provider?: ILookupProviderV3;

  static create(opts?: LookupControllerV3CreateOpts) {
    const { vaults } = getDWorkspace();
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
    });
  }

  constructor(opts: {
    nodeType: DNodeType;
    buttons: DendronBtn[];
    fuzzThreshold?: number;
  }) {
    const ctx = "LookupControllerV3:new";
    Logger.info({ ctx, msg: "enter" });
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

  get provider() {
    if (_.isUndefined(this._provider)) {
      throw new DendronError({ message: "no provider" });
    }
    return this._provider;
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
    const ctx = "prepareQuickPick";
    Logger.info({ ctx, msg: "enter" });
    const { provider } = _.defaults(opts, {
      nonInteractive: false,
    });
    this._provider = provider;
    const { buttonsPrev, buttons } = this.state;
    const quickpick = PickerUtilsV2.createDendronQuickPick(opts);
    this._quickpick = quickpick;
    // invoke button behaviors
    PickerUtilsV2.refreshButtons({ quickpick, buttons, buttonsPrev });
    await PickerUtilsV2.refreshPickerBehavior({ quickpick, buttons });
    quickpick.onDidTriggerButton(this.onTriggerButton);
    quickpick.onDidHide(() => {
      Logger.debug({ ctx: "quickpick", msg: "onHide" });
      quickpick.dispose();
      HistoryService.instance().add({
        source: "lookupProvider",
        action: "changeState",
        id: provider.id,
        data: { action: "hide" },
      });
    });
    quickpick.title = [
      `Lookup (${this.nodeType})`,
      `- version: ${DendronExtension.version()}`,
    ].join(" ");

    Logger.info({ ctx, msg: "exit" });
    return { quickpick };
  }

  async showQuickPick(opts: ShowQuickPickOpts) {
    const ctx = "showQuickPick";
    Logger.info({ ctx, msg: "enter" });
    const cancelToken = this.createCancelSource();
    const { nonInteractive, provider, quickpick } = _.defaults(opts, {
      nonInteractive: false,
    });
    Logger.info({ ctx, msg: "onUpdatePickerItems:pre" });
    // initial call of update
    await provider.onUpdatePickerItems({
      picker: quickpick,
      token: cancelToken.token,
      fuzzThreshold: this.fuzzThreshold,
    });
    Logger.info({ ctx, msg: "onUpdatePickerItems:post" });
    if (!nonInteractive) {
      provider.provide(this);
      quickpick.show();
    } else {
      quickpick.selectedItems = quickpick.items;
      await provider.onDidAccept({ quickpick, lc: this })();
    }
    Logger.info({ ctx, msg: "exit" });
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
    const ctx = "LookupControllerV3:onHide";
    this._quickpick?.dispose();
    this._quickpick = undefined;
    this._cancelTokenSource?.dispose();
    Logger.info({ ctx, msg: "exit" });
  }

  onTriggerButton = async (btn: QuickInputButton) => {
    const { _quickpick: quickpick } = this;
    const { buttons, buttonsPrev } = this.state;
    if (!quickpick) {
      return;
    }
    // set button value
    const btnType = (btn as IDendronQuickInputButton).type;
    const btnTriggered = _.find(this.state.buttons, {
      type: btnType,
    }) as DendronBtn;
    btnTriggered.toggle();
    const btnCategory = getButtonCategory(btnTriggered);
    let btnsToRefresh: DendronBtn[] = [];
    if (!_.includes(["effect"] as ButtonCategory[], btnCategory)) {
      btnsToRefresh = _.filter(this.state.buttons, (ent) => {
        return (
          ent.type !== btnTriggered.type &&
          getButtonCategory(ent) === btnCategory
        );
      });
      btnsToRefresh.map((ent) => {
        ent.pressed = false;
      });
    }
    btnsToRefresh.push(btnTriggered);
    // update button state
    PickerUtilsV2.refreshButtons({ quickpick, buttons, buttonsPrev });
    // modify button behavior
    await PickerUtilsV2.refreshPickerBehavior({
      quickpick,
      buttons: btnsToRefresh,
    });

    if (
      btnTriggered.type === "directChildOnly" ||
      btnTriggered.type === "selection2Items"
    ) {
      await this.provider.onUpdatePickerItems({
        picker: quickpick,
        token: this.cancelToken.token,
        fuzzThreshold: this.fuzzThreshold,
        forceUpdate: true,
      });
    }

    AnalyticsUtils.track(LookupEvents.LookupModifierToggledByUser, {
      command: this.provider.id,
      type: (btn as IDendronQuickInputButton).type,
      pressed: (btn as IDendronQuickInputButton).pressed,
    });
  };
}
