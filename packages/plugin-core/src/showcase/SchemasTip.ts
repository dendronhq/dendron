import { assertUnreachable } from "@dendronhq/common-all";
import { ShowcaseEntry } from "@dendronhq/engine-server";
import {
  DisplayLocation,
  IFeatureShowcaseMessage,
} from "./IFeatureShowcaseMessage";

/**
 * Just a placeholder for now to get more than 1 message.
 * TODO: Remove or Modify
 */
export class SchemasTip implements IFeatureShowcaseMessage {
  shouldShow(displayLocation: DisplayLocation): boolean {
    switch (displayLocation) {
      default:
        return true;
    }
  }
  get showcaseEntry(): ShowcaseEntry {
    return ShowcaseEntry.SchemasTip;
  }

  getDisplayMessage(displayLocation: DisplayLocation): string {
    switch (displayLocation) {
      case DisplayLocation.InformationMessage:
        return `TODO: Modify. Dendron has schemas. Try it out!`;
      case DisplayLocation.TipOfTheDayView:
        return "TODO: Modify. Dendron now has schemas. The quick brown fox jumped over the three lazy dogs.";
      default:
        assertUnreachable(displayLocation);
    }
  }

  get onConfirm() {
    return undefined;
  }

  get confirmText() {
    return undefined;
  }

  get deferText() {
    return undefined;
  }
}
