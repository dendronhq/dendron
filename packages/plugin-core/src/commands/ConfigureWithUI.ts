import { DendronWebViewKey, getStage } from "@dendronhq/common-all";
import _ from "lodash";
import { ViewColumn, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { EngineAPIService } from "../services/EngineAPIService";
import { WebViewUtils } from "../views/utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = void;

export async function getWebviewContent(): Promise<string> {
  const ws = DendronWorkspace.instance();
  const engine = ws.getEngine() as EngineAPIService;
  const resp = await engine.api._makeRequest({
    path: "static",
    method: "get",
  });
  return resp.data as string;
}

function getWebviewContent2(opts: { title: string }) {
  const port = DendronWorkspace.instance().port;
  if (_.isUndefined(port)) {
    return `<head> Still starting up </head>`;
  }
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${opts.title}</title>
      <style>
      *       {margin:0;padding:0;}
      html, 
      body    {height:100%;  width:100%; overflow:hidden;}
      table   {height:100%;  width:100%; table-layout:static; border-collapse:collapse;}
      iframe  {float:left; height:100%; width:100%;}
      .header {border-bottom:1px solid #000}
      .content {height:100%;}
    </style>
  </head>
  <body>
    <iframe width="100%" height="100%" src="http://localhost:${port}/workspace/config.html"></iframe>
  </body>
  </html>`;
}

export class ConfigureWithUICommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.CONFIGURE_UI.key;
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const title = "Dendron Configuration";

    const panel = window.createWebviewPanel(
      "dendronIframe", // Identifies the type of the webview. Used internally
      title, // Title of the panel displayed to the user
      ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        enableCommandUris: true,
        enableFindWidget: true,
        localResourceRoots: [],
      }
    );

    let resp: string;
    if (getStage() === "dev") {
      resp = WebViewUtils.genHTMLForWebView({
        title: "Dendron Config",
        view: DendronWebViewKey.CONFIGURE
      });
    } else {
      resp = await getWebviewContent2({ title });
    }
    panel.webview.html = resp;
  }
}
