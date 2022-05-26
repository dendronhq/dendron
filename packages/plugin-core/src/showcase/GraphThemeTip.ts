import {
  assertUnreachable,
  GraphThemeFeatureShowcaseTestGroups,
  GRAPH_THEME_FEATURE_SHOWCASE_TEST,
} from "@dendronhq/common-all";
import { SegmentClient } from "@dendronhq/common-server";
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

  getDisplayMessage(displayLocation: DisplayLocation): string {
    const ABUserGroup = GRAPH_THEME_FEATURE_SHOWCASE_TEST.getUserGroup(
      SegmentClient.instance().anonymousId
    );
    const tipofTheDayMessage =
      "Change the appearance of the note graph by clicking the config button on the top left corner of the graph view and selecting one of the built-in styles. You can even customize the appearance to your liking with css";
    switch (displayLocation) {
      case DisplayLocation.InformationMessage:
        if (ABUserGroup === GraphThemeFeatureShowcaseTestGroups.showMeHow) {
          return `Dendron now has new themes for Graph View. Check it out`;
        }
        return `New themes for Graph View! ${tipofTheDayMessage}`;
      case DisplayLocation.TipOfTheDayView:
        return tipofTheDayMessage;
      default:
        assertUnreachable(displayLocation);
    }
  }

  onConfirm() {
    const ABUserGroup = GRAPH_THEME_FEATURE_SHOWCASE_TEST.getUserGroup(
      SegmentClient.instance().anonymousId
    );
    if (ABUserGroup === GraphThemeFeatureShowcaseTestGroups.showMeHow) {
      showMeHowView({
        name: "Graph Theme",
        src: "https://org-dendron-public-assets.s3.amazonaws.com/images/graph-theme.gif",
        href: "https://www.loom.com/share/f2c53d2a5aeb48209b5587a3dfbb1015",
        alt: "Click on menu icon in the Graph View to change themes",
      });
    } else {
      vscode.commands.executeCommand("dendron.showNoteGraph");
    }
  }

  get confirmText(): string {
    const ABUserGroup = GRAPH_THEME_FEATURE_SHOWCASE_TEST.getUserGroup(
      SegmentClient.instance().anonymousId
    );
    if (ABUserGroup === GraphThemeFeatureShowcaseTestGroups.showMeHow) {
      return "Show me how";
    }
    return "Open graph view";
  }

  get deferText(): string {
    return "Later";
  }
}
