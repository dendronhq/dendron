import { assertUnreachable } from "@dendronhq/common-all";
import { ShowcaseEntry } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import {
  DisplayLocation,
  IFeatureShowcaseMessage,
} from "./IFeatureShowcaseMessage";

export class GraphThemeTip implements IFeatureShowcaseMessage {
  shouldShow(displayLocation: DisplayLocation): boolean {
    switch (displayLocation) {
      case DisplayLocation.InformationMessage:
      case DisplayLocation.TipOfTheDayView:
        return true;
      default:
        assertUnreachable(displayLocation);
    }
  }
  get showcaseEntry(): ShowcaseEntry {
    return ShowcaseEntry.GraphTheme;
  }

  getDisplayMessage(displayLocation: DisplayLocation): string {
    switch (displayLocation) {
      case DisplayLocation.InformationMessage:
        return `New themes for Graph View! Change the appearance...`;
      case DisplayLocation.TipOfTheDayView:
        return "Change the appearance of the note graph by clicking the config button on the top left corner of the graph view and selecting one of the built-in styles. You can even customize the appearance to your liking with css";
      default:
        assertUnreachable(displayLocation);
    }
  }

  onConfirm() {
    vscode.commands.executeCommand("dendron.showNoteGraph");
  }

  get confirmText(): string {
    return "Open Graph View";
  }

  get deferText(): string {
    return "Later";
  }
}
