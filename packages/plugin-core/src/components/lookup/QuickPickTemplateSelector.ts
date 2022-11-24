import {
  ConfigUtils,
  DendronError,
  DLogger,
  NoteProps,
} from "@dendronhq/common-all";
import { ExtensionProvider } from "../../ExtensionProvider";
import { NoteLookupProviderUtils } from "./NoteLookupProviderUtils";
import { HistoryEvent } from "@dendronhq/engine-server";
import { Logger } from "../../logger";
import * as vscode from "vscode";
import { Disposable } from "vscode";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronContext } from "../../constants";
import { AutoCompletableRegistrar } from "../../utils/registers/AutoCompletableRegistrar";
import { AutoCompleter } from "../../utils/autoCompleter";

export class QuickPickTemplateSelector {
  async getTemplate(opts: {
    logger?: DLogger;
    providerId?: string;
  }): Promise<NoteProps | undefined> {
    const logger = opts.logger || Logger;
    const id = opts.providerId || "TemplateSelector";
    const extension = ExtensionProvider.getExtension();
    const controller = await extension.lookupControllerFactory.create({
      nodeType: "note",
      buttons: [],
    });
    const provider = extension.noteLookupProviderFactory.create(id, {
      allowNewNote: false,
      forceAsIsPickerValueUsage: true,
    });
    const config = await extension.getDWorkspace().config;

    const tempPrefix = ConfigUtils.getCommands(config).templateHierarchy;
    const initialValue = tempPrefix ? `${tempPrefix}.` : undefined;

    let disposable: Disposable;
    return new Promise((resolve) => {
      NoteLookupProviderUtils.subscribe({
        id,
        controller,
        logger,
        onHide: () => {
          resolve(undefined);
          NoteLookupProviderUtils.cleanup({
            id,
            controller,
          });
        },
        onDone: (event: HistoryEvent) => {
          const data = event.data;
          if (data.cancel) {
            resolve(undefined);
          } else {
            const templateNote = event.data.selectedItems[0] as NoteProps;
            resolve(templateNote);
          }
          NoteLookupProviderUtils.cleanup({
            id,
            controller,
          });
          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
        onError: (event: HistoryEvent) => {
          const error = event.data.error as DendronError;
          vscode.window.showErrorMessage(error.message);
          resolve(undefined);
          NoteLookupProviderUtils.cleanup({
            id,
            controller,
          });
          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
      });
      controller.show({
        title: "Select template to apply",
        placeholder: "template",
        provider,
        initialValue,
      });

      VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, true);

      disposable = AutoCompletableRegistrar.OnAutoComplete(() => {
        if (controller.quickPick) {
          controller.quickPick.value = AutoCompleter.getAutoCompletedValue(
            controller.quickPick
          );

          controller.provider.onUpdatePickerItems({
            picker: controller.quickPick,
          });
        }
      });
    });
  }
}
