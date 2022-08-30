import {
  ConfigureUIMessage,
  ConfigureUIMessageEnum,
  DendronEditorViewKey,
  getWebEditorViewEntry,
} from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/common-server";
import * as vscode from "vscode";
import { ConfigureCommand } from "../../commands/ConfigureCommand";
import { WebViewUtils } from "../../views/utils";
import { DendronExtension } from "../../workspace";

export class ConfigureUIPanelFactory {
  private static panel: vscode.WebviewPanel | undefined = undefined;

  static create(ext: DendronExtension): vscode.WebviewPanel {
    if (!this.panel) {
      const { bundleName: name, label } = getWebEditorViewEntry(
        DendronEditorViewKey.CONFIGURE
      );
      this.panel = vscode.window.createWebviewPanel(
        name, // Identifies the type of the webview. Used internally
        label, // Title of the panel displayed to the user
        {
          viewColumn: vscode.ViewColumn.One,
          preserveFocus: true,
        }, // Editor column to show the new webview panel in.
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          enableCommandUris: true,
          enableFindWidget: false,
          localResourceRoots: WebViewUtils.getLocalResourceRoots(ext.context),
        }
      );
      this.panel.webview.onDidReceiveMessage(
        async (msg: ConfigureUIMessage) => {
          // eslint-disable-next-line default-case
          switch (msg.type) {
            case ConfigureUIMessageEnum.onUpdateConfig:
              {
                const { config } = msg.data;
                await DConfig.writeConfig({
                  wsRoot: ext.getDWorkspace().wsRoot,
                  config,
                });
              }
              break;
            case ConfigureUIMessageEnum.openDendronConfigYaml: {
              const openConfig = new ConfigureCommand(ext);
              openConfig.run();
              break;
            }
            default:
              return;
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
