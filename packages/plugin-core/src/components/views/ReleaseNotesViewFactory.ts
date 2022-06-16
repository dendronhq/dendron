import { IDendronExtension } from "../../dendronExtensionInterface";
import { PreviewLinkHandler } from "./PreviewLinkHandler";
import { PreviewProxy } from "./PreviewProxy";
import { ReleaseNotesPanel } from "./ReleaseNotesPanel";

/**
 * Creates a singleton PreviewProxy intended for use for displaying release
 * notes
 */
export class ReleaseNotesViewFactory {
  private static _view: ReleaseNotesPanel | undefined;

  /**
   * Get a usable PreviewProxy for showing the release notes
   */
  public static create(extension: IDendronExtension): PreviewProxy {
    // Simple singleton implementation, since we only want one release notes
    // panel at any given time.

    // if view doesn't exist yet, create a new one.
    if (!ReleaseNotesViewFactory._view) {
      ReleaseNotesViewFactory._view = new ReleaseNotesPanel({
        extension,
        linkHandler: new PreviewLinkHandler(extension),
      });
    }

    return ReleaseNotesViewFactory._view;
  }
}
