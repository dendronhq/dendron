import _ from "lodash";
import { DendronWebViewKey } from "@dendronhq/common-all";
import { ViewColumn, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { WebViewUtils } from "../views/utils";
import { BasicCommand } from "./base";
import { getWS } from "../workspace";

type CommandOpts = {};

type CommandOutput = void;

export class ShowNoteGraphCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.SHOW_NOTE_GRAPH.key;
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const title = "Dendron Note Graph";

    // Get workspace information
    const ws = getWS();

    // If panel already exists
    const existingPanel = ws.getWebView(DendronWebViewKey.NOTE_GRAPH);
    if (!_.isUndefined(existingPanel)) {
      existingPanel.reveal();
      return;
    }

    // If panel does not exist
    const panel = window.createWebviewPanel(
      "dendronIframe", // Identifies the type of the webview. Used internally
      title, // Title of the panel displayed to the user
      ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
      } // Webview options. More on these later.
    );

    const resp: string = WebViewUtils.genHTMLForWebView({
      title: "Dendron Graph",
      view: DendronWebViewKey.NOTE_GRAPH,
    });

    panel.webview.html = resp;

    // Update workspace-wide graph panel
    ws.setWebView(DendronWebViewKey.NOTE_GRAPH, panel);
  }
}
