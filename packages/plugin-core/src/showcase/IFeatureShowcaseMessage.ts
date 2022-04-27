import { ShowcaseEntry } from "@dendronhq/engine-server";

/**
 * Where the message is being displayed.
 */
export enum DisplayLocation {
  InformationMessage = "InformationMessage", // toast, i.e. vscode.ShowInformationMessage
  TipOfTheDayView = "TipOfTheDayView",
}

/**
 * How did the user respond to the Showcase message. Used in Telemetry
 */
export enum FeatureShowcaseUserResponse {
  /**
   *  User actively closed the UI without selecting an option
   */
  dismissed = "dismissed",

  /**
   * User actively selected the positive option
   */
  confirmed = "confirmed",

  /**
   * User actively selected the negative option
   */
  deferred = "deferred",
}

export interface IFeatureShowcaseMessage {
  /**
   * For the given display location, should we be showing this message. Note
   * FeatureShowcaseToaster already handles logic of not showing repeat messages
   * and not showing to brand new users, so you don't need to worry about that
   * here. You can insert logic such as A/B testing here if needed.
   * @param displayLocation
   */
  shouldShow(displayLocation: DisplayLocation): boolean;

  get showcaseEntry(): ShowcaseEntry;

  /**
   * provide the message for each display location
   * @param displayLocation
   */
  getDisplayMessage(displayLocation: DisplayLocation): string;

  /**
   * Command string for the command to run when confirm is clicked. Return
   * undefined if there is no confirm option (i.e., just a tip without any
   * actions.)
   */
  get onConfirm(): string | undefined;

  /**
   * The text to place on the 'confirm' button. Return undefined if there is no
   * confirm option (i.e., just a tip without any actions.)
   */
  get confirmText(): string | undefined;

  /**
   * The text to place on the 'defer'/'reject' button. Return undefined if there is no
   * defer option (i.e., just a tip without any actions.)
   */
  get deferText(): string | undefined;
}
