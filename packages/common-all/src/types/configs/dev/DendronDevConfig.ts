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
   * Enable displaying and indexing link candidates. Default is false
   */
  enableLinkCandidates?: boolean;
  /**
   * Enable new preview as default
   */
  enablePreviewV2?: boolean;
  /** Force the use of a specific type of watcher.
   *
   * - plugin: Uses VSCode's builtin watcher
   * - engine: Uses the engine watcher, watching the files directly without VSCode
   */
  forceWatcherType?: ForceWatcherType;
  /**
   * Enable export pod v2
   */
  enableExportPodV2?: boolean;
  /**
   * Sets self contained vaults as the default vault type. Dendron can read
   * self-contained vaults even if this option is not enabled, but it will only
   * create self contained vaults if this option is enabled.
   */
  enableSelfContainedVaults?: boolean;
  /**
   * Feature flag for iframe note references.
   * True -> renders note references as an iframe when publishing to nextjs.
   * False (Default) -> renders note references inline.
   */
  enableExperimentalIFrameNoteRef?: boolean;
  /**
   * Enable engine v3
   * True -> Use engine v3 as backend
   * False (Default) -> Continue to use engine v3 as backend
   */
  enableEngineV3?: boolean;

  /**
   * Uses SQLite as the metadata engine (the non-Prisma version). enableEngineV3
   * must also be set to true for this to work.
   */
  useSqlite?: boolean;
  /**
   * Feature flag to enable note references
   */
  enableExperimentalInlineNoteRef?: boolean;
};

export type ForceWatcherType = "plugin" | "engine";

/**
 * Generates defaults for {@link DendronDevConfig}
 * @returns DendronDevConfig
 */
export function genDefaultDevConfig(): DendronDevConfig | undefined {
  return;
}
