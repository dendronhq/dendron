/* eslint-disable camelcase */
import { DNodeType } from "./foundation";

export * from "./compat";
export * from "./foundation";
export * from "./hooks";
export * from "./intermediateConfigs";
export * from "./noteTrait";
export * from "./seed";
export * from "./typesv2";
export * from "./workspace";
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

export type Stage = "dev" | "prod" | "test";
export type DEngineQuery = {
  queryString: string;
  mode: DNodeType;
  opts?: QueryOpts;
};

export type DEngineMode = "exact" | "fuzzy";

export interface QueryOpts {
  /**
   * Should add to full nodes
   */
  fullNode?: boolean;
  /**
   * Just get one result
   */
  queryOne?: boolean;
  /**
   * Use with `createIfNew`
   * If true, create a stub node.
   * A stub node is not written to disk
   */
  stub?: boolean;
  /**
   * If node does not exist, create it?
   */
  createIfNew?: boolean;
  // --- hints
  // DEPPRECATE
  webClient?: boolean;
  initialQuery?: boolean;
  mode?: DNodeType;
}

export interface Resp<T> {
  data: T;
  error?: Error | null;
}

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
