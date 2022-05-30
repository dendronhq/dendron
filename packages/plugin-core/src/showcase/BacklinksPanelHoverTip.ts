import { assertUnreachable } from "@dendronhq/common-all";
import { ShowcaseEntry } from "@dendronhq/engine-server";
import { showMeHowView } from "../views/ShowMeHowView";
import {
  DisplayLocation,
  IFeatureShowcaseMessage,
} from "./IFeatureShowcaseMessage";

export class BacklinksPanelHoverTip implements IFeatureShowcaseMessage {
  shouldShow(_displayLocation: DisplayLocation): boolean {
    return true;
  }
  get showcaseEntry(): ShowcaseEntry {
    return ShowcaseEntry.BacklinksPanelHover;
  }

  getDisplayMessage(displayLocation: DisplayLocation): string {
    switch (displayLocation) {
      case DisplayLocation.InformationMessage:
        return `The backlinks panel supports hover - place your cursor over a backlink to quickly browse the context of the note.`;
      case DisplayLocation.TipOfTheDayView:
        return 'The backlinks panel supports hover - place your cursor over a backlink to quickly browse the context of the note. To make the hover appear faster, reduce the "workbench.hover.delay" in your VSCode settings.';
      default:
        assertUnreachable(displayLocation);
    }
  }

  onConfirm() {
    showMeHowView({
      name: "Backlinks Panel Hover",
      src: "https://org-dendron-public-assets.s3.amazonaws.com/images/vscode-hover-in-backlinks-panel.gif",
      href: "https://www.loom.com/share/1bf2dd0b42ff4f0f9945952fb463c4cc",
      alt: "Backlinks Panel supports Hover Preview",
    });
  }

  get confirmText(): string {
    return "Show me how";
  }

  get deferText(): string {
    return "Later";
  }
}
