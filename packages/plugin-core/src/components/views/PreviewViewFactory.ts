import { IDendronExtension } from "../../dendronExtensionInterface";
import { IPreviewLinkHandler, PreviewLinkHandler } from "./PreviewLinkHandler";
import { PreviewProxy } from "./PreviewProxy";
import { PreviewPanel } from "./PreviewPanel";
import { TextDocumentServiceFactory } from "../../services/TextDocumentServiceFactory";

/**
 * NOTE: This class is meant to only be used in _extension.ts/workspace.ts, or in
 * tests. If you need to show preview in a component, inject a PreviewProxy in
 * the constructor signature and use that object to show/hide preview instead.
 */
export class PreviewPanelFactory {
  private static _preview: PreviewPanel | undefined;

  /**
   * Get a usable PreviewProxy for showing the preview
   */
  public static create(
    extension: IDendronExtension,
    linkHander?: IPreviewLinkHandler
  ): PreviewProxy {
    // Simple singleton implementation, since we only want one preview panel at
    // any given time.

    // if preview panel doesn't exist yet, create a new one.
    // if a custom link handler is provided, use that to create a new preview panel.
    if (!PreviewPanelFactory._preview || linkHander) {
      PreviewPanelFactory._preview = new PreviewPanel({
        extension,
        linkHandler: linkHander || new PreviewLinkHandler(extension),
        textDocumentService: TextDocumentServiceFactory.create(extension),
      });
    }

    return PreviewPanelFactory._preview;
  }
}
