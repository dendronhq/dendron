import { ShowcaseEntry } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import {
  DisplayLocation,
  IFeatureShowcaseMessage,
} from "./IFeatureShowcaseMessage";
import { DendronTreeViewKey } from "@dendronhq/common-all";

export class GraphPanelTip implements IFeatureShowcaseMessage {
  shouldShow(_displayLocation: DisplayLocation): boolean {
    return true;
  }
  get showcaseEntry(): ShowcaseEntry {
    return ShowcaseEntry.GraphPanel;
  }

  getDisplayMessage(_displayLocation: DisplayLocation): string {
    return "We're experimenting with a note graph panel in the new Dendron sidebar. Check it out!";
  }

  onConfirm() {
    vscode.commands.executeCommand(`${DendronTreeViewKey.GRAPH_PANEL}.focus`);
  }

  get confirmText(): string {
    return "Show Graph Panel";
  }

  get deferText(): string {
    return "Later";
  }
}
