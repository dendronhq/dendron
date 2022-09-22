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

export interface TemplateSelector {
  /**
   * A method for selecting a template.
   * `undefined` when no template is selected.
   *
   * can take in optional logger and provider id based on
   */
  getTemplate(opts: {
    logger?: DLogger;
    providerId?: string;
  }): Promise<NoteProps | undefined>;
}

export class QuickPickTemplateSelector implements TemplateSelector {
  getTemplate(opts: {
    logger?: DLogger;
    providerId?: string;
  }): Promise<NoteProps | undefined> {
    const logger = opts.logger || Logger;
    const id = opts.providerId || "TemplateSelector";
    const extension = ExtensionProvider.getExtension();
    const controller = extension.lookupControllerFactory.create({
      nodeType: "note",
      buttons: [],
    });
    const provider = extension.noteLookupProviderFactory.create(id, {
      allowNewNote: false,
    });
    const config = extension.getDWorkspace().config;

    const tempPrefix = ConfigUtils.getCommands(config).templateHierarchy;
    const initialValue = tempPrefix ? `${tempPrefix}.` : undefined;

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
        },
        onError: (event: HistoryEvent) => {
          const error = event.data.error as DendronError;
          vscode.window.showErrorMessage(error.message);
          resolve(undefined);
          NoteLookupProviderUtils.cleanup({
            id,
            controller,
          });
        },
      });
      controller.show({
        title: "Select template to apply",
        placeholder: "template",
        provider,
        initialValue,
      });
    });
  }
}
