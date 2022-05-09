import { assertUnreachable } from "@dendronhq/common-all";
import { SegmentClient } from "@dendronhq/common-server";
import { ShowcaseEntry } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import {
  MeetingNoteTestGroups,
  MEETING_NOTE_FEATURE_SHOWCASE_TEST,
} from "../abTests";
import { AnalyticsUtils } from "../utils/analytics";
import * as vscode from "vscode";
import {
  DisplayLocation,
  IFeatureShowcaseMessage,
} from "./IFeatureShowcaseMessage";

export class MeetingNotesTip implements IFeatureShowcaseMessage {
  shouldShow(displayLocation: DisplayLocation): boolean {
    switch (displayLocation) {
      case DisplayLocation.InformationMessage: {
        const ABUserGroup = MEETING_NOTE_FEATURE_SHOWCASE_TEST.getUserGroup(
          SegmentClient.instance().anonymousId
        );

        return (
          ABUserGroup === MeetingNoteTestGroups.show &&
          !AnalyticsUtils.isFirstWeek()
        );
      }
      case DisplayLocation.TipOfTheDayView:
        return true;
      default:
        assertUnreachable(displayLocation);
    }
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
