import { assertUnreachable } from "@dendronhq/common-all";
import { ShowcaseEntry } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { showMeHowView } from "../views/ShowMeHowView";
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

  getDisplayMessage(_displayLocation: DisplayLocation): string {
    return `Dendron now has new themes for Graph View. Check it out`;
  }

  onConfirm() {
    showMeHowView({
      name: "Graph Theme",
      src: "https://org-dendron-public-assets.s3.amazonaws.com/images/graph-theme.gif",
      href: "https://www.loom.com/share/f2c53d2a5aeb48209b5587a3dfbb1015",
      alt: "Click on menu icon in the Graph View to change themes",
    });
    vscode.commands.executeCommand("dendron.showNoteGraphView");
  }

  get confirmText(): string {
    return "Show me how";
  }

  get deferText(): string {
    return "Later";
  }
}
