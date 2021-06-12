import _ from "lodash";
import {
  DendronWebViewKey,
  GraphViewMessage,
  GraphViewMessageType,
  VaultUtils,
} from "@dendronhq/common-all";
import { Uri, ViewColumn, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { WebViewUtils } from "../views/utils";
import { BasicCommand } from "./base";
import { getWS } from "../workspace";
import { VSCodeUtils } from "../utils";
import path from "path";

type CommandOpts = {};

type CommandOutput = void;

export class ShowSchemaGraphCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.SHOW_SCHEMA_GRAPH_V2.key;
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const title = "Schema Graph";

    // Get workspace information
    const ws = getWS();

    // If panel already exists
    const existingPanel = ws.getWebView(DendronWebViewKey.SCHEMA_GRAPH);

    if (!_.isUndefined(existingPanel)) {
      try {
        // If error, panel disposed and needs to be recreated
        existingPanel.reveal();
        return;
      } catch {}
    }

    // If panel does not exist
    const panel = window.createWebviewPanel(
      "dendronIframe", // Identifies the type of the webview. Used internally
      title, // Title of the panel displayed to the user
      ViewColumn.Two, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    const resp: string = WebViewUtils.genHTMLForWebView({
      title: "Schema Graph",
      view: DendronWebViewKey.SCHEMA_GRAPH,
    });

    panel.webview.html = resp;

    // Listener
    panel.webview.onDidReceiveMessage(async (msg: GraphViewMessage) => {
      switch (msg.type) {
        case GraphViewMessageType.onSelect: {
          const engine = getWS().getEngine();
          const schema = engine.schemas[msg.data.id];

          const wsRoot = ws._enginev2?.wsRoot;

          if (msg.data.vault && wsRoot) {
            const vaults = engine.vaults.filter(
              (v) => VaultUtils.getName(v) === msg.data.vault
            );
            if (_.isEmpty(vaults)) return;

            const schemaPath = path.join(
              wsRoot,
              vaults[0].fsPath,
              `root.schema.yml`
            );
            const uri = Uri.file(schemaPath);

            await VSCodeUtils.openFileInEditor(uri);
          } else if (schema && wsRoot) {
            const fname = schema.fname;
            // const vault = schema.vault;

            const schemaPath = path.join(
              wsRoot,
              schema.vault.fsPath,
              `${fname}.schema.yml`
            );
            const uri = Uri.file(schemaPath);

            await VSCodeUtils.openFileInEditor(uri);
          }
          break;
        }
        // case GraphViewMessageType.onGetActiveEditor: {
        //   const document = VSCodeUtils.getActiveTextEditor()?.document;
        //   if (document) {
        //     if (
        //       !getWS().workspaceService?.isPathInWorkspace(document.uri.fsPath)
        //     ) {
        //       // not in workspace
        //       return;
        //     }
        //     const note = VSCodeUtils.getNoteFromDocument(document);
        //     if (note) {
        //       // refresh note
        //       this.refresh(note);
        //     }
        //   }
        //   break;
        // }
        // case GraphViewMessageType.onReady: {
        //   const profile = getDurationMilliseconds(start);
        //   Logger.info({ ctx, msg: "treeViewLoaded", profile, start });
        //   AnalyticsUtils.track(VSCodeEvents.TreeView_Ready, {
        //     duration: profile,
        //   });
        //   break;
        // }
        default:
          console.log("got data", msg);
          break;
      }
    });

    // Update workspace-wide graph panel
    ws.setWebView(DendronWebViewKey.SCHEMA_GRAPH, panel);
  }
}
