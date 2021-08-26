import {
  DendronWebViewKey,
  DMessageType,
  SeedBrowserMessage,
  SeedBrowserMessageType,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { WebViewUtils } from "../views/utils";
import { getWS } from "../workspace";
import { SeedAddCommand } from "./SeedAddCommand";
import { SeedCommandBase } from "./SeedCommandBase";
import * as vscode from "vscode";
import { ViewColumn } from "vscode";

type CommandOpts = {};

type CommandOutput = void;

export class SeedBrowseCommand extends SeedCommandBase<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SEED_BROWSE.key;
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const ws = getWS();
    const existingPanel = ws.getWebView(DendronWebViewKey.SEED_BROWSER);

    if (!_.isUndefined(existingPanel)) {
      existingPanel.reveal();
      return;
    }

    // If panel does not exist
    const panel = vscode.window.createWebviewPanel(
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

    const resp = WebViewUtils.genHTMLForWebView({
      title: "Seed Browser",
      view: DendronWebViewKey.SEED_BROWSER,
    });

    panel.webview.html = resp;

    panel.webview.onDidReceiveMessage(async (msg: SeedBrowserMessage) => {
      switch (msg.type) {
        case SeedBrowserMessageType.onSeedAdd: {
          const cmd = new SeedAddCommand();
          const resp = await cmd.execute({ seedId: msg.data.data });

          // Error should already be logged within SeedAddCommand()
          if (!resp.error) {
            this.postSeedStateToWebview();
          }

          break;
        }
        case SeedBrowserMessageType.onOpenUrl: {
          vscode.env.openExternal(vscode.Uri.parse(msg.data.data));
          break;
        }
        case DMessageType.MESSAGE_DISPATCHER_READY: {
          this.postSeedStateToWebview();
          break;
        }

        default:
          break;
      }
    });

    ws.setWebView(DendronWebViewKey.SEED_BROWSER, panel);

    panel.onDidDispose(() => {
      ws.setWebView(DendronWebViewKey.SEED_BROWSER, undefined);
    });
  }
}
