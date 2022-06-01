import {
  MetadataService,
  PriorTools,
  ShowcaseEntry,
} from "@dendronhq/engine-server";
import _ from "lodash";
import vscode from "vscode";
import {
  DisplayLocation,
  IFeatureShowcaseMessage,
} from "./IFeatureShowcaseMessage";

export class ObsidianImportTip implements IFeatureShowcaseMessage {
  /**
   * Only shows a toast, this tip does not appear in tip of day.
   * @param displayLocation
   * @returns
   */
  shouldShow(displayLocation: DisplayLocation): boolean {
    if (displayLocation === DisplayLocation.TipOfTheDayView) {
      return false;
    }

    return _.includes(
      MetadataService.instance().priorTools,
      PriorTools.Obsidian
    );
  }

  get showcaseEntry(): ShowcaseEntry {
    return ShowcaseEntry.ObsidianImport;
  }

  getDisplayMessage(_displayLocation: DisplayLocation): string {
    return `Would you like to import your notes from an existing Obsidian vault?`;
  }

  onConfirm() {
    vscode.commands.executeCommand("dendron.importObsidianPod");
  }

  get confirmText(): string {
    return "Import Now";
  }

  get deferText(): string {
    return "Later";
  }
}
