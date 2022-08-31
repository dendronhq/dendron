import { assertUnreachable } from "@dendronhq/common-all";
import { ShowcaseEntry } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { showMeHowView } from "../views/ShowMeHowView";
import {
  DisplayLocation,
  IFeatureShowcaseMessage,
} from "./IFeatureShowcaseMessage";

export class SettingsUITip implements IFeatureShowcaseMessage {
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
    return ShowcaseEntry.SettingsUI;
  }

  getDisplayMessage(_displayLocation: DisplayLocation): string {
    return "You can configure Dendron by using the `Dendron: Configure(UI) command`. You can also optionally edit the config file directly it with the `Dendron: Configure(yaml) command`";
  }

  onConfirm() {
    vscode.commands.executeCommand("dendron.configureUI");
    showMeHowView({
      name: "Dendron Configure (UI)",
      src: "https://org-dendron-public-assets.s3.amazonaws.com/images/settingsUI.gif",
      href: "https://www.loom.com/share/3eba0f8523ac4d1ab150e8d3af9f1b0b",
      alt: "Run Ctrl+shift+P > Dendron: Configure (UI)",
    });
  }

  get confirmText(): string {
    return "Show me how";
  }

  get deferText(): string {
    return "Later";
  }
}
