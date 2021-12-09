import { DendronEditorViewKey } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { WebViewUtils } from "../views/utils";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = void;

export class ShowNoteGraphCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SHOW_NOTE_GRAPH.key;

  private _panel;

  constructor(panel: vscode.WebviewPanel) {
    super();
    this._panel = panel;
  }
  async gatherInputs(): Promise<any> {
    return {};
  }

  async execute() {
    const resp: string = await WebViewUtils.genHTMLForWebView({
      title: "Dendron Graph",
      view: DendronEditorViewKey.NOTE_GRAPH,
    });

    this._panel.webview.html = resp;

    this._panel.reveal();
  }
}
