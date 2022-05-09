import {
  DendronEditorViewKey,
  getWebEditorViewEntry,
} from "@dendronhq/common-all";
import vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { WebViewUtils } from "../views/utils";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = void;

export class ShowSchemaValidatorCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SHOW_SCHEMA_VALIDATOR.key;

  _panel: vscode.WebviewPanel;

  constructor(panel: vscode.WebviewPanel) {
    super();
    this._panel = panel;
  }

  async gatherInputs(): Promise<any> {
    return {};
  }

  async execute() {
    const { bundleName: name } = getWebEditorViewEntry(
      DendronEditorViewKey.SCHEMA_VALIDATOR
    );
    const ext = ExtensionProvider.getExtension();
    const port = ext.port!;
    const engine = ext.getEngine();
    const { wsRoot } = engine;
    const webViewAssets = WebViewUtils.getJsAndCss();
    const html = await WebViewUtils.getWebviewContent({
      ...webViewAssets,
      port,
      wsRoot,
      panel: this._panel,
      name,
    });

    this._panel.webview.html = html;
    this._panel.reveal();
  }
}
