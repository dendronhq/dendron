import { ShowcaseEntry } from "@dendronhq/engine-server";
import _ from "lodash";
import { VSCodeUtils } from "../vsCodeUtils";
import {
  DisplayLocation,
  IFeatureShowcaseMessage,
} from "./IFeatureShowcaseMessage";

export class CreateScratchNoteKeybindingTip implements IFeatureShowcaseMessage {
  /**
   * Only shows a toast, this tip does not appear in tip of day.
   * @param displayLocation
   * @returns
   */
  shouldShow(displayLocation: DisplayLocation): boolean {
    if (displayLocation === DisplayLocation.TipOfTheDayView) {
      return false;
    }

    return true;
  }

  get showcaseEntry(): ShowcaseEntry {
    return ShowcaseEntry.CreateScratchNoteKeybindingTip;
  }

  getDisplayMessage(_displayLocation: DisplayLocation): string {
    return `Keyboard shortcut for "Dendron: Create Scratch Note" has changed. If you wish to keep the original, please follow the instructions online.`;
  }

  onConfirm() {
    VSCodeUtils.openLink(
      "https://wiki.dendron.so/notes/50kdbcwwda3gphjhccb0e5t"
    );
  }

  get confirmText(): string {
    return "Show me how";
  }

  get deferText(): string {
    return "Later";
  }
}
