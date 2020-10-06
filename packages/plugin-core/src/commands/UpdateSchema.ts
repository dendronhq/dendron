import { DNodeUtils, Note } from "@dendronhq/common-all";
import _ from "lodash";
import { window, Uri, ViewColumn } from "vscode";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import path from "path";
import { EngineAPIService } from "../services/EngineAPIService";

type CommandOpts = {};

type CommandOutput = void;

async function getWebviewContent(): Promise<string> {
  const ws = DendronWorkspace.instance();
  const engine = ws.getEngine() as EngineAPIService;
  const resp = await engine.api._makeRequest({
    path: "static",
    method: "get",
  });
  return resp.data as string;
}

function getWebviewContent2() {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cat Coding</title>
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
    <iframe width="100%" height="100%" src="http://localhost:3000/posts/proto2"></iframe>
  </body>
  </html>`;
}

export class UpdateSchemaCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const panel = window.createWebviewPanel(
      "catCoding", // Identifies the type of the webview. Used internally
      "Cat Coding", // Title of the panel displayed to the user
      ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
      } // Webview options. More on these later.
    );
    const resp = await getWebviewContent2();
    panel.webview.html = resp;
    window.showInformationMessage("bond");
  }
}
