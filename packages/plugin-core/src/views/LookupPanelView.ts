import {
  DendronTreeViewKey,
  DMessage,
  LookupModifierStatePayload,
  LookupViewMessage,
  LookupViewMessageEnum,
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { Disposable } from "vscode";
import {
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
} from "../components/lookup/ButtonTypes";
import {
  ILookupViewModel,
  NameModifierMode,
  SelectionMode,
} from "../components/lookup/LookupViewModel";
import { VaultSelectionMode } from "../components/lookup/types";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { WebViewUtils } from "./utils";

/**
 * A view that handles the UI state for the Lookup Panel (the webview on a VS
 * Code side panel). This instantiates and then communicates with the React
 * based webview (the true _view_). This class is essentially a proxy for
 * plugin-core to the webview.
 */
export class LookupPanelView implements vscode.WebviewViewProvider, Disposable {
  private _view?: vscode.WebviewView;
  private _viewModel: ILookupViewModel;

  private _disposables: Disposable[] = [];

  constructor(viewModel: ILookupViewModel) {
    this._viewModel = viewModel;
    this.bindToViewModel();

    this._disposables.push(
      vscode.window.registerWebviewViewProvider(
        DendronTreeViewKey.LOOKUP_VIEW,
        this
      )
    );
  }

  dispose() {
    this._disposables.forEach((value) => value.dispose());
  }

  private bindToViewModel() {
    // Only these options are currently visible in the Lookup View Side Panel
    this._disposables.push(
      this._viewModel.selectionState.bind(this.refresh, this)
    );
    this._disposables.push(
      this._viewModel.isApplyDirectChildFilter.bind(this.refresh, this)
    );
    this._disposables.push(
      this._viewModel.isMultiSelectEnabled.bind(this.refresh, this)
    );
    this._disposables.push(
      this._viewModel.isCopyNoteLinkEnabled.bind(this.refresh, this)
    );
    this._disposables.push(
      this._viewModel.isSplitHorizontally.bind(this.refresh, this)
    );
  }

  public postMessage(msg: DMessage) {
    this._view?.webview.postMessage(msg);
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.onDidReceiveMessage(
      this.onDidReceiveMessageHandler,
      this
    );

    WebViewUtils.prepareTreeView({
      ext: ExtensionProvider.getExtension(),
      key: DendronTreeViewKey.LOOKUP_VIEW,
      webviewView,
    });

    this._view?.show();
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

        const { category, type } = msg.data;

        switch (category) {
          case "effect": {
            // in this case, type is an array of the selected effects
            this._viewModel.isMultiSelectEnabled.value = _.includes(
              type,
              "multiSelect"
            );

            this._viewModel.isCopyNoteLinkEnabled.value = _.includes(
              type,
              "copyNoteLink"
            );

            break;
          }
          default: {
            switch (type) {
              case LookupSelectionTypeEnum.selection2Items:
                this._viewModel.selectionState.value =
                  this._viewModel.selectionState.value ===
                  SelectionMode.selection2Items
                    ? SelectionMode.None
                    : SelectionMode.selection2Items;
                break;

              case LookupSelectionTypeEnum.selection2link:
                this._viewModel.selectionState.value =
                  this._viewModel.selectionState.value ===
                  SelectionMode.selection2Link
                    ? SelectionMode.None
                    : SelectionMode.selection2Link;
                break;

              case LookupSelectionTypeEnum.selectionExtract:
                this._viewModel.selectionState.value =
                  this._viewModel.selectionState.value ===
                  SelectionMode.selectionExtract
                    ? SelectionMode.None
                    : SelectionMode.selectionExtract;
                break;

              case "other": {
                this._viewModel.vaultSelectionMode.value =
                  this._viewModel.vaultSelectionMode.value ===
                  VaultSelectionMode.alwaysPrompt
                    ? VaultSelectionMode.smart
                    : VaultSelectionMode.alwaysPrompt;
                break;
              }
              case "multiSelect": {
                this._viewModel.isMultiSelectEnabled.value =
                  !this._viewModel.isMultiSelectEnabled.value;
                break;
              }
              case "copyNoteLink": {
                this._viewModel.isCopyNoteLinkEnabled.value =
                  !this._viewModel.isCopyNoteLinkEnabled.value;
                break;
              }
              case "directChildOnly": {
                this._viewModel.isApplyDirectChildFilter.value =
                  !this._viewModel.isApplyDirectChildFilter.value;
                break;
              }
              case LookupNoteTypeEnum.journal: {
                this._viewModel.nameModifierMode.value =
                  this._viewModel.nameModifierMode.value ===
                  NameModifierMode.Journal
                    ? NameModifierMode.None
                    : NameModifierMode.Journal;
                break;
              }
              case LookupNoteTypeEnum.scratch: {
                this._viewModel.nameModifierMode.value =
                  this._viewModel.nameModifierMode.value ===
                  NameModifierMode.Scratch
                    ? NameModifierMode.None
                    : NameModifierMode.Scratch;
                break;
              }
              case LookupNoteTypeEnum.task: {
                this._viewModel.nameModifierMode.value =
                  this._viewModel.nameModifierMode.value ===
                  NameModifierMode.Task
                    ? NameModifierMode.None
                    : NameModifierMode.Task;
                break;
              }
              case "horizontal": {
                this._viewModel.isSplitHorizontally.value =
                  !this._viewModel.isSplitHorizontally.value;
                break;
              }
              default:
                throw new Error(
                  `Message Handler for Type ${type} Not Implemented`
                );
            }
          }
        }
        break;
      }
      case LookupViewMessageEnum.onRequestControllerState:
      case LookupViewMessageEnum.onUpdate:
      default:
        break;
    }
  }

  private refresh() {
    const payload: LookupModifierStatePayload = [
      {
        type: "selection2link",
        pressed:
          this._viewModel.selectionState.value === SelectionMode.selection2Link,
      },
      {
        type: "selectionExtract",
        pressed:
          this._viewModel.selectionState.value ===
          SelectionMode.selectionExtract,
      },
      {
        type: "selection2Items",
        pressed:
          this._viewModel.selectionState.value ===
          SelectionMode.selection2Items,
      },
      {
        type: "directChildOnly",
        pressed: this._viewModel.isApplyDirectChildFilter.value,
      },
      {
        type: "multiSelect",
        pressed: this._viewModel.isMultiSelectEnabled.value,
      },
      {
        type: "copyNoteLink",
        pressed: this._viewModel.isCopyNoteLinkEnabled.value,
      },
      {
        type: "horizontal",
        pressed: this._viewModel.isSplitHorizontally.value,
      },
    ];

    if (this._view) {
      this._view.webview.postMessage({
        type: LookupViewMessageEnum.onUpdate,
        data: { payload },
        source: "vscode",
      });
    }
  }
}
