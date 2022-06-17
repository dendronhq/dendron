// import { WebViewPanelFactory } from "./SeedBrowseCommand";
// import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import * as vscode from "vscode";
import {
  DendronEditorViewKey,
  getWebEditorViewEntry,
} from "@dendronhq/common-all";
import { ExtensionProvider } from "../ExtensionProvider";
import { WebViewUtils } from "../views/utils";

type CommandOpts = {};

type CommandOutput = void;

export class ShowVisualizationCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SHOW_VISUALIZATION.key;
  static requireActiveWorkspace: boolean = true;

  private _view;

  constructor(view: vscode.WebviewView) {
    super();
    this._view = view;
    console.log("view:", this._view);
  }

  async execute() {
    console.log("Hello from Show Visualization Command");

    const { bundleName: name } = getWebEditorViewEntry(
      DendronEditorViewKey.VISUALIZATION
    );

    const ext = ExtensionProvider.getExtension();
    const port = ext.port!;
    const engine = ext.getEngine();
    const { wsRoot } = engine;

    const webViewAssets = WebViewUtils.getJsAndCss();
    const html = await WebViewUtils.getWebviewContent({
      ...webViewAssets,
      name,
      port,
      wsRoot,
      panel: this._view,
    });

    console.log("webview", this._view.webview);

    this._view.webview.html = html;
  }
}
