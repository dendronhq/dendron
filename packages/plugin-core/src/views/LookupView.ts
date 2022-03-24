import {
  DendronError,
  DendronTreeViewKey,
  DMessage,
  LookupModifierStatePayload,
  LookupViewMessage,
  LookupViewMessageEnum,
} from "@dendronhq/common-all";
import { Logger } from "../logger";
import * as vscode from "vscode";
import { WebViewUtils } from "./utils";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { getButtonCategory } from "../components/lookup/buttons";
import { IDendronExtension } from "../dendronExtensionInterface";
import { DendronBtn } from "../components/lookup/ButtonTypes";

export class LookupView implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.LOOKUP_VIEW;
  private _view?: vscode.WebviewView;
  private _controller?: ILookupControllerV3;
  private _extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this._extension = extension;
  }

  public postMessage(msg: DMessage) {
    this._view?.webview.postMessage(msg);
  }

  public registerController(controller: ILookupControllerV3) {
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
      ext: this._extension,
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
            throw new DendronError({
              message: "Got unexpected button category",
              payload: {
                ctx: "LookupView.onDidReceiveMessageHandler",
                category,
              },
            });
          }
        }
        break;
      }
      case LookupViewMessageEnum.onRequestControllerState: {
        const quickpick = this._controller?.quickpick as DendronQuickPickerV2;
        this.refresh({ buttons: quickpick.buttons });
        break;
      }
      case LookupViewMessageEnum.onUpdate:
      default:
        break;
    }
  }

  public refresh(opts: { buttons: DendronBtn[] }) {
    const { buttons } = opts;
    const payload: LookupModifierStatePayload = buttons.map(
      (button: DendronBtn) => {
        return {
          type: button.type,
          pressed: button.pressed,
        };
      }
    );

    if (this._view) {
      this._view.webview.postMessage({
        type: LookupViewMessageEnum.onUpdate,
        data: { payload },
        source: "vscode",
      });
    }
  }
}
