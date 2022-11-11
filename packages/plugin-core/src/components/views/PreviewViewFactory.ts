import "reflect-metadata";
import { container } from "tsyringe";
import { PreviewPanel } from "../../views/common/preview/PreviewPanel";
import { PreviewProxy } from "./PreviewProxy";

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
  public static create(): PreviewProxy {
    // Simple singleton implementation, since we only want one preview panel at
    // any given time.

    // if preview panel doesn't exist yet, create a new one.
    if (!PreviewPanelFactory._preview) {
      PreviewPanelFactory._preview = container.resolve(PreviewPanel);
    }

    return PreviewPanelFactory._preview;
  }
}
