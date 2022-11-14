import { ShowcaseEntry } from "@dendronhq/engine-server";
import {
  DisplayLocation,
  IFeatureShowcaseMessage,
} from "./IFeatureShowcaseMessage";
import * as vscode from "vscode";

/**
 * Creates a tip of the day that contains a simple message with no buttons
 * @param showcaseEntry
 * @param displayMessage
 * @returns
 */
export function createSimpleTipOfDayMsg(
  showcaseEntry: ShowcaseEntry,
  displayMessage: string
): IFeatureShowcaseMessage {
  return new TipOnlyMessage(showcaseEntry, displayMessage, undefined, () => {});
}

/**
 * Creates a tip of the day that also contains a button linking to a url containing a doc
 * url (to wiki.dendron.so for example)
 * @param input
 * @returns
 */
export function createTipOfDayMsgWithDocsLink(
  input: Pick<IFeatureShowcaseMessage, "confirmText"> & {
    showcaseEntry: ShowcaseEntry;
    displayMessage: string;
    docsUrl: string;
  }
): IFeatureShowcaseMessage {
  return new TipOnlyMessage(
    input.showcaseEntry,
    input.displayMessage,
    input.confirmText,
    () => {
      vscode.commands.executeCommand("vscode.open", input.docsUrl);
    }
  );
}

class TipOnlyMessage implements IFeatureShowcaseMessage {
  constructor(
    private _showcaseEntry: ShowcaseEntry,
    private _displayMessage: string,
    private _confirmText: string | undefined,
    private _onConfirm: () => void
  ) {}

  shouldShow(displayLocation: DisplayLocation): boolean {
    return displayLocation === DisplayLocation.TipOfTheDayView;
  }

  get showcaseEntry(): ShowcaseEntry {
    return this._showcaseEntry;
  }

  getDisplayMessage(): string {
    return this._displayMessage;
  }

  onConfirm(): void {
    this._onConfirm();
  }

  get confirmText(): string | undefined {
    return this._confirmText;
  }

  get deferText(): string | undefined {
    return undefined;
  }
}
