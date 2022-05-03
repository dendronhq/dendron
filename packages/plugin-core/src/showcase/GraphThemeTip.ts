import { assertUnreachable } from "@dendronhq/common-all";
import { ShowcaseEntry } from "@dendronhq/engine-server";
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

  getDisplayMessage(displayLocation: DisplayLocation): string {
    switch (displayLocation) {
      case DisplayLocation.InformationMessage:
        return `Dendron now has new themes for Graph View. Check it out`;
      case DisplayLocation.TipOfTheDayView:
        return "Change the appearance of the note graph by clicking the config button on the top left corner of the graph view and selecting one of the built-in styles. You can even customize the appearance to your liking with css";
      default:
        assertUnreachable(displayLocation);
    }
  }

  onConfirm() {
    showMeHowView(
      "Graph Theme",
      "https://org-dendron-public-assets.s3.amazonaws.com/images/graph-theme.gif"
    );
  }

  get confirmText(): string {
    return "Show me how";
  }

  get deferText(): string {
    return "Later";
  }
}
