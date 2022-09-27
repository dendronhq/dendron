/* eslint-disable camelcase */

export * from "./compat";
export * from "./foundation";
export * from "./hooks";
export * from "./intermediateConfigs";
export * from "./noteTrait";
export * from "./seed";
export * from "./typesv2";
export * from "./DWorkspaceV2";
export * from "./foundation";
export * from "./seed";
export * from "./intermediateConfigs";
export * from "./compat";
export * from "./editor";
export * from "./lookup";
export * from "./unified";
export * from "./events";
export * from "./cacheData";
export * from "./errorTypes";
export * from "./store";
export * from "./ReducedDEngine";
export * from "./DVault";
export * from "./DWorkspace";
export * from "./FindNoteOpts";
export * from "./SeedEntry";

export type Stage = "dev" | "prod" | "test";

export type DEngineMode = "exact" | "fuzzy";

export type DendronSiteFM = {
  published?: boolean;
  noindex?: boolean;
  /**
   * Specify canonical url for content
   */
  canonicalUrl?: string;
  nav_order?: number;
  nav_exclude?: boolean;
  /**
   * Should exclude children from nav
   */
  nav_exclude_children?: boolean;
  permalink?: string;
  /**
   * If collection, don't show in nav
   * and have custom sorting rules
   */
  has_collection?: boolean;
  /**
   * Default: created
   */
  sort_by?: "created" | "title";
  sort_order?: "reverse" | "normal";
  skipLevels?: number;
};

export enum DendronUserSpecial {
  "everyone" = "everyone",
  "anonymous" = "anonymous",
}
