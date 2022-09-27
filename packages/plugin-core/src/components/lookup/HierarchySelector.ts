import { DendronError, DVault } from "@dendronhq/common-all";
import { HistoryEvent } from "@dendronhq/engine-server";
import path from "path";
import * as vscode from "vscode";
import { LookupControllerV3CreateOpts } from "./LookupControllerV3Interface";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../vsCodeUtils";
import { ExtensionProvider } from "../../ExtensionProvider";
import { NoteLookupProviderUtils } from "./NoteLookupProviderUtils";
import { DendronContext } from "../../constants";
import { AutoCompleter } from "../../utils/autoCompleter";
import { AutoCompletableRegistrar } from "../../utils/registers/AutoCompletableRegistrar";
import { Disposable } from "vscode";

/**
 * Interface for a user (or test mock) control for selecting a hierarchy. Mostly
 * exposed for testing purposes.
 */
export interface HierarchySelector {
  /**
   * A method for getting the hierarchy in an async manner. Returning undefined
   * should be interpreted that no hierarchy was selected. It also returns the
   * vault of selected hierarchy.
   */
  getHierarchy(): Promise<{ hierarchy: string; vault: DVault } | undefined>;
}

/**
 * Implementation of HierarchySelector that prompts user to with a lookup
 * controller V3.
 */
export class QuickPickHierarchySelector implements HierarchySelector {
  getHierarchy(): Promise<{ hierarchy: string; vault: DVault } | undefined> {
    return new Promise<{ hierarchy: string; vault: DVault } | undefined>(
      (resolve) => {
        const lookupCreateOpts: LookupControllerV3CreateOpts = {
          nodeType: "note",
          disableVaultSelection: true,
        };
        const extension = ExtensionProvider.getExtension();
        const lc = extension.lookupControllerFactory.create(lookupCreateOpts);

        const PROVIDER_ID: string = "HierarchySelector";

        const provider = extension.noteLookupProviderFactory.create(
          PROVIDER_ID,
          {
            allowNewNote: false,
            forceAsIsPickerValueUsage: true,
          }
        );

        const defaultNoteName = path.basename(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
          ".md"
        );

        let disposable: Disposable;

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
              const vault = data.selectedItems[0].vault;
              resolve({ hierarchy, vault });
            }
            NoteLookupProviderUtils.cleanup({
              id: PROVIDER_ID,
              controller: lc,
            });
            disposable?.dispose();
            VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
          },
          onError: (event: HistoryEvent) => {
            const error = event.data.error as DendronError;
            vscode.window.showErrorMessage(error.message);
            resolve(undefined);
            NoteLookupProviderUtils.cleanup({
              id: PROVIDER_ID,
              controller: lc,
            });
            disposable?.dispose();
            VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
          },
        });
        lc.show({
          placeholder: "Enter Hierarchy Name",
          provider,
          initialValue: defaultNoteName,
          title: `Select Hierarchy for Export`,
        });

        VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, true);

        disposable = AutoCompletableRegistrar.OnAutoComplete(() => {
          if (lc.quickPick) {
            lc.quickPick.value = AutoCompleter.getAutoCompletedValue(
              lc.quickPick
            );

            lc.provider.onUpdatePickerItems({
              picker: lc.quickPick,
            });
          }
        });
      }
    );
  }
}
