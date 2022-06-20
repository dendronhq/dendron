import { WebViewUtils } from "../views/utils";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import * as vscode from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import {
  DendronEditorViewKey,
  getWebEditorViewEntry,
} from "@dendronhq/common-all";

type CommandOpts = {};

type CommandOutput = void;

export class ShowVisualizationCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static requireActiveWorkspace: boolean = true;

  key = DENDRON_COMMANDS.SHOW_VISUALIZATION.key;

  private _panel;

  /* Get the panel on which to display visualization */
  constructor(panel: vscode.WebviewPanel) {
    super();
    this._panel = panel;
  }

  async execute() {
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
      panel: this._panel,
    });

    this._panel.webview.html = html;
  }
}
