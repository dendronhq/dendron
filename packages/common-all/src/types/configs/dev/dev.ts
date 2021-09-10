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
};

/**
 * Constants holding all dev config related {@link DendronConfigEntry}
 *
 * Try to keep these simple until going out of beta.
 */
export const DEV = {
  NEXT_SERVER_URL: {
    label: "next server url",
    desc: "custom url for the nextjs server",
  },
  NEXT_STATIC_ROOT: {
    label: "next static root",
    desc: "Root directory for the static assets of the nextjs server",
  },
  ENGINE_SERVER_PORT: {
    label: "engine server port",
    desc: "What port to use for the engine server. Defaults to creating on startup.",
  },
  ENABLE_WEB_UI: {
    label: "Enable web UI",
    desc: "Enable experimental web ui. Defaults to false.",
  },
  ENABLE_LINK_CANDIDATES: {
    label: "Enable link candidates",
    desc: "Enable displaying and indexing link candidates. Defaults to false.",
  },
  ENABLE_PREVIEW_V2: {
    label: "Enable Preview V2",
    desc: "Use preview V2 as the default preview.",
  },
};

export function genDefaultDevConfig(): DendronDevConfig | undefined {
  return;
}
