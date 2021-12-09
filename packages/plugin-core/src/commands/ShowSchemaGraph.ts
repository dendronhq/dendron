import { DendronEditorViewKey } from "@dendronhq/common-all";
import vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { WebViewUtils } from "../views/utils";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = void;

export class ShowSchemaGraphCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SHOW_SCHEMA_GRAPH.key;

  _panel: vscode.WebviewPanel;

  constructor(panel: vscode.WebviewPanel) {
    super();
    this._panel = panel;
  }

  async gatherInputs(): Promise<any> {
    return {};
  }

  async execute() {
    const resp: string = await WebViewUtils.genHTMLForWebView({
      title: "Schema Graph",
      view: DendronEditorViewKey.SCHEMA_GRAPH,
    });

    this._panel.webview.html = resp;
  }
}
