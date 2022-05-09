import { assertUnreachable } from "@dendronhq/common-all";
import { ShowcaseEntry } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import {
  DisplayLocation,
  IFeatureShowcaseMessage,
} from "./IFeatureShowcaseMessage";

export class MeetingNotesTip implements IFeatureShowcaseMessage {
  shouldShow(_displayLocation: DisplayLocation): boolean {
    return true;
  }
  get showcaseEntry(): ShowcaseEntry {
    return ShowcaseEntry.TryMeetingNotes;
  }

  getDisplayMessage(displayLocation: DisplayLocation): string {
    switch (displayLocation) {
      case DisplayLocation.InformationMessage:
        return `Dendron now has meeting notes. Try it out!`;
      case DisplayLocation.TipOfTheDayView:
        return "Dendron now has meeting notes, which lets you easily create a meeting note with a pre-built template. Try it out now!";
      default:
        assertUnreachable(displayLocation);
    }
  }

  onConfirm() {
    vscode.commands.executeCommand("dendron.createMeetingNote");
  }

  get confirmText(): string {
    return "Create a meeting note";
  }

  get deferText(): string {
    return "Later";
  }
}
