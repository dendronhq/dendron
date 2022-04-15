import { VSCodeEvents } from "@dendronhq/common-all";
import { SegmentClient } from "@dendronhq/common-server";
import { MetadataService, ShowcaseEntry } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import {
  MeetingNoteTestGroups,
  MEETING_NOTE_FEATURE_SHOWCASE_TEST,
} from "./abTests";
import { AnalyticsUtils } from "./utils/analytics";

/**
 * Class to showcase certain features of Dendron (like a tip of the day). Right
 * now, we have only 1 feature - we can expand functionality in this class as we
 * have more tips.
 */
export class FeatureShowcase {
  /**
   * Show right now uses vscode.showInformationMessage.  Later, we can have
   * different display locations, such as the proposed Dendron Side Panel
   */
  public show(): void {
    const ABUserGroup = MEETING_NOTE_FEATURE_SHOWCASE_TEST.getUserGroup(
      SegmentClient.instance().anonymousId
    );

    if (
      ABUserGroup === MeetingNoteTestGroups.show &&
      MetadataService.instance().getFeatureShowcaseStatus(
        ShowcaseEntry.TryMeetingNotes
      ) === undefined
    ) {
      this.showMeetingNotesTip();
    }
  }

  /**
   * Tip to try out meeting notes
   */
  private showMeetingNotesTip() {
    const confirm = "Try It";
    const reject = "Later";

    vscode.window
      .showInformationMessage(
        `Would you like to try out the new Meeting Notes Feature?`,
        confirm,
        reject
      )
      .then((resp) => {
        let userResponse;
        if (resp === undefined) {
          userResponse = "ignored";
          MetadataService.instance().setFeatureShowcaseStatus(
            ShowcaseEntry.TryMeetingNotes
          );
        } else if (resp === confirm) {
          userResponse = "confirmed";
          MetadataService.instance().setFeatureShowcaseStatus(
            ShowcaseEntry.TryMeetingNotes
          );
        } else {
          // Don't set the metadata because the option for rejected is "Later",
          // let's toast the user again later.
          userResponse = "rejected";
        }

        AnalyticsUtils.track(VSCodeEvents.FeatureShowcased, {
          messageType: ShowcaseEntry.TryMeetingNotes,
          displayLocation: "InformationMessage",
          userResponse,
        });

        if (resp === confirm) {
          vscode.commands.executeCommand("dendron.createMeetingNote");
        }
      });
  }
}
