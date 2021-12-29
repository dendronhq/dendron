import {
  assertUnreachable,
  DendronTreeViewKey,
  DMessage,
  LookupModifierStatePayload,
  LookupViewMessage,
  LookupViewMessageEnum,
} from "@dendronhq/common-all";
import { Logger } from "../logger";
import * as vscode from "vscode";
import { WebViewUtils } from "./utils";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { DendronBtn, getButtonCategory } from "../components/lookup/buttons";
import { getExtension } from "../workspace";

export class LookupView implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.LOOKUP_VIEW;
  private _view?: vscode.WebviewView;
  private _controller?: LookupControllerV3;

  public postMessage(msg: DMessage) {
    this._view?.webview.postMessage(msg);
  }

  public registerController(controller: LookupControllerV3) {
    this._controller = controller;
  }

  public deregisterController() {
    this._controller = undefined;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    WebViewUtils.prepareTreeView({
      ext: getExtension(),
      key: DendronTreeViewKey.LOOKUP_VIEW,
      webviewView,
    });

    webviewView.webview.onDidReceiveMessage(
      this.onDidReceiveMessageHandler,
      this
    );
  }

  async onDidReceiveMessageHandler(msg: LookupViewMessage) {
    const ctx = "onDidReceiveMessage";
    Logger.info({ ctx, data: msg });
    switch (msg.type) {
      case LookupViewMessageEnum.onValuesChange: {
        Logger.info({
          ctx: `${ctx}:onValuesChange`,
          data: msg.data,
        });

        const { category, type, checked } = msg.data;
        const buttons = this._controller?.state.buttons as DendronBtn[];
        switch (category) {
          case "selection":
          case "note": {
            const buttonToUpdate = buttons.find((button) => {
              if (type === undefined) {
                return getButtonCategory(button) === category && button.pressed;
              } else {
                return button.type === type;
              }
            }) as DendronBtn;
            await this._controller?.onTriggerButton(buttonToUpdate);
            break;
          }
          case "effect": {
            // get curent state of controller's effect modifiers
            const effectButtons = this._controller?.state.buttons.filter(
              (button) => {
                return getButtonCategory(button) === "effect";
              }
            ) as DendronBtn[];
            effectButtons.forEach(async (button) => {
              // logical xor
              const shouldUpdateButton =
                type.includes(button.type) !== button.pressed;
              if (shouldUpdateButton) {
                await this._controller?.onTriggerButton(button);
              }
            });
            break;
          }
          case "filter":
          case "split": {
            const buttonToUpdate = buttons.find((button) => {
              return button.type === type && button.pressed !== checked;
            }) as DendronBtn;
            await this._controller?.onTriggerButton(buttonToUpdate);
            break;
          }
          default: {
            assertUnreachable();
          }
        }
        break;
      }
      case LookupViewMessageEnum.onRequestControllerState: {
        const quickpick = this._controller?.quickpick as DendronQuickPickerV2;
        PickerUtilsV2.refreshLookupView({ buttons: quickpick.buttons });
        break;
      }
      case LookupViewMessageEnum.onUpdate:
      default:
        break;
    }
  }

  public refresh(payload: LookupModifierStatePayload) {
    if (this._view) {
      this._view.webview.postMessage({
        type: LookupViewMessageEnum.onUpdate,
        data: { payload },
        source: "vscode",
      });
    }
  }
}
