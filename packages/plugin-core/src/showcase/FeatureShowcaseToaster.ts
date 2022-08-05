import { VSCodeEvents } from "@dendronhq/common-all";
import { MetadataService, ShowcaseEntry } from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { AnalyticsUtils } from "../utils/analytics";
import { ALL_FEATURE_SHOWCASES } from "./AllFeatureShowcases";
import {
  DisplayLocation,
  FeatureShowcaseUserResponse,
  IFeatureShowcaseMessage,
} from "./IFeatureShowcaseMessage";

/**
 * Class to showcase certain features of Dendron as a toast message
 */
export class FeatureShowcaseToaster {
  /**
   * Show a toast containing information about a Dendron Feature. Doesn't show
   * messages more than once, and it also doesn't show to new user's in their
   * first week of Dendron.
   * @returns whether a toast was shown or not
   */
  public showToast(): boolean {
    // Don't show tips for users in their first week.
    if (AnalyticsUtils.isFirstWeek()) {
      return false;
    }

    for (const message of ALL_FEATURE_SHOWCASES) {
      // Keep cycling through messages until there's one that should be shown
      if (
        !this.hasShownMessage(message.showcaseEntry) &&
        message.shouldShow(DisplayLocation.InformationMessage)
      ) {
        this.showInformationMessage(
          DisplayLocation.InformationMessage,
          message
        );

        return true;
      }
    }

    return false;
  }

  /**
   * Show a specific toast message. This will not show if the message has
   * already been shown to the user, but unlike {@link showToast}, it will show
   * even if the user is still in their first week of usage.
   * @param message
   * @returns
   */
  public showSpecificToast(message: IFeatureShowcaseMessage): boolean {
    if (
      !this.hasShownMessage(message.showcaseEntry) &&
      message.shouldShow(DisplayLocation.InformationMessage)
    ) {
      this.showInformationMessage(DisplayLocation.InformationMessage, message);

      return true;
    }

    return false;
  }

  /**
   * Check if we've shown this particular message to the user already
   * @param type
   * @returns
   */
  private hasShownMessage(type: ShowcaseEntry): boolean {
    return (
      MetadataService.instance().getFeatureShowcaseStatus(type) !== undefined
    );
  }

  private showInformationMessage(
    displayLocation: DisplayLocation,
    message: IFeatureShowcaseMessage
  ) {
    AnalyticsUtils.track(VSCodeEvents.FeatureShowcaseDisplayed, {
      messageType: message.showcaseEntry,
      displayLocation,
    });

    const options = _.without(
      [message.confirmText, message.deferText],
      undefined
    ) as string[];

    vscode.window
      .showInformationMessage(
        message.getDisplayMessage(DisplayLocation.InformationMessage),
        ...options
      )
      .then((resp) => {
        let userResponse;
        MetadataService.instance().setFeatureShowcaseStatus(
          message.showcaseEntry
        );
        if (resp === undefined) {
          userResponse = FeatureShowcaseUserResponse.dismissed;
        } else if (resp === message.confirmText) {
          userResponse = FeatureShowcaseUserResponse.confirmed;
        } else {
          // Don't set the metadata because the user deferred let's toast the
          // user again later.
          userResponse = FeatureShowcaseUserResponse.deferred;
        }

        AnalyticsUtils.track(VSCodeEvents.FeatureShowcaseResponded, {
          messageType: message.showcaseEntry,
          displayLocation: DisplayLocation.InformationMessage,
          userResponse,
        });

        if (resp === message.confirmText && message.onConfirm) {
          message.onConfirm.bind(message)();
        }
      });
  }
}
