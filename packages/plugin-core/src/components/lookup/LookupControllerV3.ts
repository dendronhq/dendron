import { DNodeTypeV2 } from "@dendronhq/common-all";
import _ from "lodash";
import { QuickInputButton } from "vscode";
import { CancellationTokenSource } from "vscode-languageclient";
import { VSCodeUtils } from "../../utils";
import { DendronBtn, IDendronQuickInputButton } from "./buttons";
import { ILookupProviderV3 } from "./LookupProviderV3";
import { DendronQuickPickerV2, LookupControllerState } from "./types";
import { CreateQuickPickOpts, PickerUtilsV2 } from "./utils";

export class LookupControllerV3 {
  public state: LookupControllerState;
  public nodeType: DNodeTypeV2;
  protected _cancelTokenSource?: CancellationTokenSource;
  public quickpick?: DendronQuickPickerV2;

  constructor(opts: { nodeType: DNodeTypeV2; buttons: DendronBtn[] }) {
    const { buttons, nodeType } = opts;
    this.nodeType = nodeType;
    this.state = {
      buttons,
      buttonsPrev: [],
    };
    this._cancelTokenSource = VSCodeUtils.createCancelSource();
  }

  async show(
    opts: CreateQuickPickOpts & {
      nonInteractive?: boolean;
      initialValue?: string;
      provider: ILookupProviderV3;
    }
  ) {
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
      quickpick.show();
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
