import _ from "lodash";
import {
  DendronWebViewKey,
  GraphViewMessage,
  GraphViewMessageType,
} from "@dendronhq/common-all";
import { ViewColumn, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { WebViewUtils } from "../views/utils";
import { BasicCommand } from "./base";
import { getEngine, getWS } from "../workspace";
import { GotoNoteCommand } from "./GotoNote";

type CommandOpts = {};

type CommandOutput = void;

export class ShowNoteGraphCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.SHOW_NOTE_GRAPH_V2.key;
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const title = "Note Graph";

    // Get workspace information
    const ws = getWS();

    // If panel already exists
    const existingPanel = ws.getWebView(DendronWebViewKey.NOTE_GRAPH);

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
        enableFindWidget: true,
      }
    );

    const resp: string = WebViewUtils.genHTMLForWebView({
      title: "Dendron Graph",
      view: DendronWebViewKey.NOTE_GRAPH,
    });

    panel.webview.html = resp;

    // Listener
    panel.webview.onDidReceiveMessage(async (msg: GraphViewMessage) => {
      switch (msg.type) {
        case GraphViewMessageType.onSelect: {
          const note = getEngine().notes[msg.data.id];
          await new GotoNoteCommand().execute({
            qs: note.fname,
            vault: note.vault,
          });
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
    ws.setWebView(DendronWebViewKey.NOTE_GRAPH, panel);
  }
}
