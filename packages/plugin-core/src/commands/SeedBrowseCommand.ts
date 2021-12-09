import {
  DendronEditorViewKey,
  DMessageEnum,
  SeedBrowserMessage,
  SeedBrowserMessageType,
} from "@dendronhq/common-all";
import { SeedService } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { ViewColumn } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { WebViewUtils } from "../views/utils";
import { SeedAddCommand } from "./SeedAddCommand";
import { SeedCommandBase } from "./SeedCommandBase";

type CommandOpts = {};

type CommandOutput = void;

export class WebViewPanelFactory {
  private static panel: vscode.WebviewPanel | undefined = undefined;

  static create(svc: SeedService): vscode.WebviewPanel {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        "dendronIframe",
        "Seed Registry",
        {
          viewColumn: ViewColumn.Active,
          preserveFocus: false,
        },
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          enableFindWidget: true,
        }
      );

      this.panel.webview.onDidReceiveMessage(
        async (msg: SeedBrowserMessage) => {
          switch (msg.type) {
            case SeedBrowserMessageType.onSeedAdd: {
              const cmd = new SeedAddCommand();
              const resp = await cmd.execute({ seedId: msg.data.data });

              // Error should already be logged within SeedAddCommand()
              if (!resp.error) {
                this.panel?.webview.postMessage({
                  type: SeedBrowserMessageType.onSeedStateChange,
                  data: {
                    msg: svc.getSeedsInWorkspace(),
                  },
                  source: "vscode",
                });
              }

              break;
            }
            case SeedBrowserMessageType.onOpenUrl: {
              vscode.env.openExternal(vscode.Uri.parse(msg.data.data));
              break;
            }
            case DMessageEnum.MESSAGE_DISPATCHER_READY: {
              this.panel?.webview.postMessage({
                type: SeedBrowserMessageType.onSeedStateChange,
                data: {
                  msg: svc.getSeedsInWorkspace(),
                },
                source: "vscode",
              });
              break;
            }

            default:
              break;
          }
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }

    return this.panel;
  }
}

export class SeedBrowseCommand extends SeedCommandBase<
  CommandOpts,
  CommandOutput
> {
  _panel: vscode.WebviewPanel;

  constructor(panel: vscode.WebviewPanel) {
    super();
    this._panel = panel;
  }

  key = DENDRON_COMMANDS.SEED_BROWSE.key;
  async gatherInputs(): Promise<any> {
    return {};
  }

  async execute() {
    const resp = await WebViewUtils.genHTMLForWebView({
      title: "Seed Browser",
      view: DendronEditorViewKey.SEED_BROWSER,
    });

    this._panel.webview.html = resp;

    this._panel.reveal();
  }
}
