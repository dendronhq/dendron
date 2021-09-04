import {
  DendronWebViewKey,
  GraphViewMessage,
  GraphViewMessageType,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import vscode, { Uri, ViewColumn, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { WebViewUtils } from "../views/utils";
import { getExtension, getWSV2 } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = void;

export class ShowSchemaGraphCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SHOW_SCHEMA_GRAPH_V2.key;
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const title = "Schema Graph";

    // Get workspace information
    const ext = getExtension();

    // If panel already exists
    const existingPanel = ext.getWebView(DendronWebViewKey.SCHEMA_GRAPH);

    if (!_.isUndefined(existingPanel)) {
      try {
        // If error, panel disposed and needs to be recreated
        existingPanel.reveal();
        return;
      } catch (error) {
        console.error(error);
      }
    }

    // If panel does not exist
    const panel = window.createWebviewPanel(
      "dendronIframe", // Identifies the type of the webview. Used internally
      title, // Title of the panel displayed to the user
      {
        viewColumn: ViewColumn.Beside,
        preserveFocus: true,
      }, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: true,
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
          const engine = getExtension().getEngine();
          const schema = engine.schemas[msg.data.id];

          const { wsRoot } = getWSV2();

          await vscode.commands.executeCommand(
            "workbench.action.focusFirstEditorGroup"
          );
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
        //       !getExtension().workspaceService?.isPathInWorkspace(document.uri.fsPath)
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
    ext.setWebView(DendronWebViewKey.SCHEMA_GRAPH, panel);
  }
}
