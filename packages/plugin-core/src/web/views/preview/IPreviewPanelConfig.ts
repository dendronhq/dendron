import { Theme } from "@dendronhq/common-all";

/**
 * Configuration for the preview panel
 */
export interface IPreviewPanelConfig {
  /**
   * Configures the theme used for preview
   */
  theme: Theme;
}

export class DummyPreviewPanelConfig implements IPreviewPanelConfig {
  get theme() {
    return Theme.LIGHT;
  }
}
