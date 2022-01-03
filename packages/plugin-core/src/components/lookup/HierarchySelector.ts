import { DendronError } from "@dendronhq/common-all";
import { HistoryEvent } from "@dendronhq/engine-server";
import path from "path";
import * as vscode from "vscode";
import { LookupControllerV3CreateOpts } from "./LookupControllerV3Interface";
import { NoteLookupProviderUtils } from "./utils";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../vsCodeUtils";
import { ExtensionProvider } from "../../ExtensionProvider";

/**
 * Interface for a user (or test mock) control for selecting a hierarchy. Mostly
 * exposed for testing purposes.
 */
export interface HierarchySelector {
  /**
   * A method for getting the hierarchy in an async manner. Returning undefined
   * should be interpreted that no hierarchy was selected.
   */
  getHierarchy(): Promise<string | undefined>;
}

/**
 * Implementation of HierarchySelector that prompts user to with a lookup
 * controller V3.
 */
export class QuickPickHierarchySelector implements HierarchySelector {
  getHierarchy(): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
      const lookupCreateOpts: LookupControllerV3CreateOpts = {
        nodeType: "note",
        disableVaultSelection: true,
      };
      const extension = ExtensionProvider.getExtension();
      const lc = extension.lookupControllerFactory.create(lookupCreateOpts);

      const PROVIDER_ID: string = "HierarchySelector";

      const provider = extension.noteLookupProviderFactory.create(PROVIDER_ID, {
        allowNewNote: false,
        forceAsIsPickerValueUsage: true,
      });

      const defaultNoteName = path.basename(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
        ".md"
      );

      NoteLookupProviderUtils.subscribe({
        id: PROVIDER_ID,
        controller: lc,
        logger: Logger,
        onHide: () => {
          resolve(undefined);
          NoteLookupProviderUtils.cleanup({
            id: PROVIDER_ID,
            controller: lc,
          });
        },
        onDone: async (event: HistoryEvent) => {
          const data = event.data;
          if (data.cancel) {
            resolve(undefined);
          } else {
            const hierarchy = data.selectedItems[0].fname;
            resolve(hierarchy);
          }
          NoteLookupProviderUtils.cleanup({
            id: PROVIDER_ID,
            controller: lc,
          });
        },
        onError: (event: HistoryEvent) => {
          const error = event.data.error as DendronError;
          vscode.window.showErrorMessage(error.message);
          resolve(undefined);
          NoteLookupProviderUtils.cleanup({
            id: PROVIDER_ID,
            controller: lc,
          });
        },
      });
      lc.show({
        placeholder: "Enter Hierarchy Name",
        provider,
        initialValue: defaultNoteName,
        title: `Select Hierarchy for Export`,
      });
    });
  }
}
