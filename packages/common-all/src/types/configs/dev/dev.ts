/**
 * Namespace for all dev configurations.
 *
 * This is a namespace for all feature configs that are experimental.
 * Keep this as flat as possible unless you know in advance
 * what the config namespace will look like once it goes out of beta.
 */
export type DendronDevConfig = {
  /**
   * Custom next server
   */
  nextServerUrl?: string;
  /**
   * Static assets for next
   */
  nextStaticRoot?: string;
  /**
   * What port to use for engine server. Default behavior is to create at startup
   */
  engineServerPort?: number;
  /**
   * Enable experimental web ui. Default is false
   */
  enableWebUI?: boolean;
  /**
   * Enable displaying and indexing link candidates. Default is false
   */
  enableLinkCandidates?: boolean;
  /**
   * Enable new preview as default
   */
  enablePreviewV2?: boolean;
  /**
   * Enable export pod v2
   */
  enableExportPodV2?: boolean;
};

/**
 * Generates defaults for {@link DendronDevConfig}
 * @returns DendronDevConfig
 */
export function genDefaultDevConfig(): DendronDevConfig | undefined {
  return;
}
