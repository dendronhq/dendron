// TODO: remove this disable once we deprecate old site config.
/* eslint-disable camelcase */
import GithubSlugger from "github-slugger";
import _ from "lodash";
import minimatch from "minimatch";
import path from "path";
import querystring from "querystring";
import semver from "semver";
import { ERROR_SEVERITY } from "./constants";
import { DendronError, ErrorMessages } from "./error";
import { COLORS_LIST } from "./colors";
import { CONFIG_TO_MINIMUM_COMPAT_MAPPING } from "./constants/configs/compat";
import {
  DendronSiteConfig,
  DHookDict,
  DVault,
  NoteProps,
  SEOProps,
  NotePropsDict,
  LegacyDuplicateNoteBehavior,
} from "./types";
import { TaskConfig } from "./types/configs/workspace/task";
import {
  configIsV4,
  DendronCommandConfig,
  DendronPreviewConfig,
  DendronWorkspaceConfig,
  genDefaultCommandConfig,
  genDefaultPreviewConfig,
  genDefaultWorkspaceConfig,
  IntermediateDendronConfig,
  JournalConfig,
  LookupConfig,
  NoteLookupConfig,
  ScratchConfig,
  StrictConfigV4,
  StrictConfigV5,
} from "./types/intermediateConfigs";
import { isWebUri } from "./util/regex";
import {
  DendronPublishingConfig,
  DuplicateNoteBehavior,
  genDefaultPublishingConfig,
  HierarchyConfig,
} from "./types/configs/publishing/publishing";
import { GithubConfig } from "./types/configs/publishing/github";

/**
 * Dendron utilities
 */
export class DUtils {
  static minimatch = minimatch;
  static semver = semver;
  static querystring = querystring;
}

export const getSlugger = () => {
  return new GithubSlugger();
};

/**
 * determine if given parameter is numeric
 * https://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric/1830844#1830844
 * @param n
 * @returns boolean
 */
export const isNumeric = (n: any) => {
  // eslint-disable-next-line no-restricted-globals, radix
  return !isNaN(parseInt(n)) && isFinite(n);
};

export function isBlockAnchor(anchor?: string): boolean {
  // not undefined, not an empty string, and the first character is ^
  return !!anchor && anchor[0] === "^";
}

export function isLineAnchor(anchor?: string): boolean {
  // not undefined, not an empty string, and the first character is L, and is followed by numbers
  return !!anchor && /L\d+/.test(anchor);
}

/** A type guard for things that are not undefined.
 *
 * This is equivalent to !_.isUndefined(), except that it provides a type guard
 * ensuring the parameter is not undefined. This is useful when filtering:
 *
 * function foo(list: (string | undefined)[]) {
 *   const stringsOnly = list.filter(isNotUndefined);
 * }
 *
 * This will give stringsOnly the type string[]. Without the type guard, it would have
 * received the type (string | undefined)[] despite the fact that we filtered out undefined.
 */
export function isNotUndefined<T>(t: T | undefined): t is T {
  return !_.isUndefined(t);
}

/**
 * Check if the value u is a falsy value.
 */
export function isFalsy(u: any): boolean {
  if (_.isBoolean(u)) {
    return u === false;
  }
  return _.some([_.isUndefined(u), _.isEmpty(u), _.isNull(u)]);
}

/** Calculates a basic integer hash for the given string.
 *
 * This is very unsafe, do not rely on this for anything where collisions are bad.
 *
 * Adapted from https://github.com/darkskyapp/string-hash.
 * Originally released under CC0 1.0 Universal (CC0 1.0) Public Domain Dedication.
 */
function basicStringHash(text: string) {
  // eslint-disable-next-line no-bitwise
  return (
    // eslint-disable-next-line no-bitwise
    _.reduce(
      text,
      (prev, curr) => {
        return prev + curr.charCodeAt(0);
      },
      5381
    ) >>>
    // JavaScript does bitwise operations (like XOR, above) on 32-bit signed
    // integers. Since we want the results to be always positive, convert the
    // signed int to an unsigned by doing an unsigned bitshift.
    0
  );
}

/** Given a string, return a random color as a HTML color code.
 *
 * The same string will always generate the same color, and different strings will get different random colors.
 */
export function randomColor(text: string) {
  return COLORS_LIST[basicStringHash(text) % COLORS_LIST.length];
}

/** Only some colors are recognized, other colors will be returned without being modified.
 *
 * Examples of recognized colors:
 * * #45AB35
 * * rgb(123, 23, 45)
 * * rgb(123 23 45)
 * * hsl(123, 23%, 45%)
 * * hsl(123 23% 45%)
 *
 * This function does not verify that the input colors are valid, but as long as a valid color is passed in
 * it will not generate an invalid color.
 *
 * @param color
 * @param translucency A number between 0 and 1, with 0 being fully transparent and 1 being fully opaque.
 * @returns
 */
export function makeColorTranslucent(color: string, translucency: number) {
  let match = color.match(/^#[\dA-Fa-f]{6}$/);
  if (match) return `${color}${(translucency * 255).toString(16)}`;
  match = color.match(/^((rgb|hsl)\( *[\d.]+ *, *[\d.]+%? *, *[\d.]+%? *)\)$/);
  if (match) return `${match[1]}, ${translucency})`;
  match = color.match(/^((rgb|hsl)\( *[\d.]+ *[\d.]+%? *[\d.]+%? *)\)$/);
  if (match) return `${match[1]} / ${translucency})`;

  return color;
}

/** A map that automatically inserts a value provided by the factory when a missing key is looked up.
 *
 * Modeled after python's `defaultdict`.
 *
 * Mind that `get` may mutate the map, which may be unintuitive.
 *
 * Example usage:
 *
 * ```ts
 * const myMap = new DefaultMap<string, string[]>(() => []);
 * myMap.get("foo").push("bar");
 * ```
 */
export class DefaultMap<K, V> {
  private _internalMap = new Map<K, V>();
  private _factory: (key: K) => V;

  public constructor(factory: (key: K) => V) {
    this._factory = factory;
  }

  public get(key: K) {
    let value = this._internalMap.get(key);
    if (_.isUndefined(value)) {
      value = this._factory(key);
      this._internalMap.set(key, value);
    }
    return value;
  }

  public set(key: K, value: V) {
    return this._internalMap.set(key, value);
  }

  public has(key: K) {
    return this._internalMap.has(key);
  }

  public keys() {
    return this._internalMap.keys();
  }

  public values() {
    return this._internalMap.values();
  }

  public entries() {
    return this._internalMap.entries();
  }

  public delete(key: K) {
    return this._internalMap.delete(key);
  }

  public get size() {
    return this._internalMap.size;
  }
}

/** Maps a `K` to a list of `V`s. */
export class ListMap<K, V> {
  private _internalMap = new Map<K, V[]>();

  public get(key: K) {
    return this._internalMap.get(key);
  }

  public add(key: K, ...toAdd: V[]) {
    let values = this._internalMap.get(key);
    if (values === undefined) values = [];
    values.push(...toAdd);
    this._internalMap.set(key, values);
  }

  public delete(key: K, ...toDelete: V[]) {
    const values = this._internalMap.get(key);
    if (values === undefined) return;
    _.pull(values, ...toDelete);
    if (values.length === 0) {
      this._internalMap.delete(key);
    } else {
      this._internalMap.set(key, values);
    }
  }

  public has(key: K, value: V) {
    const values = this._internalMap.get(key);
    if (values === undefined) return false;
    return values.includes(value);
  }
}

export class NoteFNamesDict {
  private _internalMap = new ListMap<string, string>();

  public constructor(initialNotes?: NoteProps[]) {
    if (initialNotes) this.addAll(initialNotes);
  }

  public get(notes: Readonly<NotePropsDict>, fname: string) {
    const keys = this._internalMap.get(cleanName(fname));
    if (keys === undefined) return [];
    return keys.map((key) => notes[key]).filter(isNotUndefined);
  }

  /** Returns true if dict has `note` exactly with this fname and id. */
  public has(note: NoteProps): boolean {
    return !!this._internalMap
      // there are notes with this fname
      .get(cleanName(note.fname))
      // and one of those has matching id
      ?.some((maybeMatch) => maybeMatch === note.id);
  }

  public add(note: NoteProps) {
    if (this.has(note)) return; // avoid duplicates
    this._internalMap.add(cleanName(note.fname), note.id);
  }

  public addAll(notes: NoteProps[]) {
    notes.forEach((note) => this.add(note));
  }

  public delete(note: NoteProps) {
    this._internalMap.delete(cleanName(note.fname), note.id);
  }
}
export class FIFOQueue<T> {
  private _internalQueue: T[] = [];

  public constructor(init?: T[]) {
    if (init) this._internalQueue = init;
  }

  public enqueue(item: T) {
    this._internalQueue.push(item);
  }

  public enqueueAll(items: T[]) {
    for (const item of items) this.enqueue(item);
  }

  public dequeue() {
    return this._internalQueue.shift();
  }

  public get length() {
    return this._internalQueue.length;
  }
}

/** Similar to lodash `_.groupBy`, except not limited to string keys. */
export function groupBy<K, V>(
  collection: V[],
  iteratee: (value: V, index: number) => K
): Map<K, V[]> {
  const map = new Map<K, V[]>();
  collection.forEach((value, index) => {
    const key = iteratee(value, index);
    let group = map.get(key);
    if (group === undefined) {
      group = [];
      map.set(key, group);
    }
    group.push(value);
  });
  return map;
}

export function mapValues<K, I, O>(
  inMap: Map<K, I>,
  applyFn: (valueIn: I) => O
): Map<K, O> {
  const outMap = new Map<K, O>();
  for (const [key, value] of inMap.entries()) {
    outMap.set(key, applyFn(value));
  }
  return outMap;
}

/** Throttles a given async function so that it is only executed again once the first execution is complete.
 *
 * Similar to lodash _.throttle, except that:
 * 1. It's aware of the inputs, and will only throttle calls where `keyFn` returns the same key for the inputs of that call.
 * 2. Rather than a set timeout, it will keep throttling until the first async call is complete or if set, the `maxTimeout` is reached.
 *
 * @param fn The function to throttle.
 * @param keyFn A function that takes the inputs to an `fn` call and turns them into an identifying key, where to calls with same input will have the same key.
 * @param timeout Optional, in ms. If set, the throttle will not throttle for more than this much time. Once the timeout is reached, the next call will be allowed to execute.
 * @returns The throttled function. This function will return its results if it got executed, or undefined it it was throttled.
 */
export function throttleAsyncUntilComplete<I extends any[], O>({
  fn,
  keyFn,
  timeout,
}: {
  fn: (...args: I) => Promise<O>;
  keyFn: (...args: I) => string | number;
  timeout?: number;
}): (...args: I) => Promise<O | undefined> {
  const lastStarted = new Map<ReturnType<typeof keyFn>, number>();
  return async (...args: I) => {
    const key = keyFn(...args);
    const last = lastStarted.get(key);
    if (
      last === undefined ||
      (timeout !== undefined && Date.now() - last > timeout)
    ) {
      // Function was never run with this input before or it timed out, re-run it
      lastStarted.set(key, Date.now());
      let out: O;
      try {
        out = await fn(...args);
      } finally {
        lastStarted.delete(key);
      }
      return out;
    }
    return undefined;
  };
}

type DebounceStates = "timeout" | "execute" | "trailing";
type DebounceStateMap = Map<string | number, DebounceStates>;

/** Debounces a given async function so that it is only executed again once the first execution is complete.
 *
 * Similar to lodash _.debounce, except that:
 * 1. It's aware of the inputs, and will only debounce calls where `keyFn` returns the same key for the inputs of that call.
 * 2. In addition to the timeout, it will also debouce calls while the async function is executing.
 *
 * Differently from `throttleAsyncUntilComplete`, this will wait for the timeout to expire before running the function for the first time.
 * Additionally, if any calls occur while the function is being executed and `trailing` is set,
 * another timeout and execution will happen once the current execution is done.
 * For example, consider this timeline where the arrows are calls to the debounced function.
 *
 * ```
 * +---------+---------+---------+---------+
 * | timeout | execute | timeout | execute |
 * +---------+---------+---------+---------+
 * ^   ^   ^     ^
 * ```
 * The timeout starts at first function call, all calls during that time are debounced, and the function finally executes after the timeout.
 * Because another function call happens during the execution of the async function, another timeout and execution trigger right after the
 * first is done (this will only happen if trailing is set). After that point, no more function calls occur so no more timeouts or executions happen.
 *
 * **Check `windowDecorations.ts` for an example of how this is used. It was primarily purpose-built for that.
 *
 * @param fn The function to debounce.
 * @param keyFn A function that takes the inputs to an `fn` call and turns them into an identifying key, where to calls with same input will have the same key.
 * @param timeout In ms. The function will not execute until this much time has passed. In other words, there will be at least this much time between executions.
 * @param trailing Optional. If set, an additional execution will be done to respond to calls during the execute phase.
 * @returns An object containing the debounced function, and the
 */
export function debounceAsyncUntilComplete<I extends any[], O>({
  fn,
  keyFn,
  timeout,
  trailing,
}: {
  fn: (...args: I) => Promise<O>;
  keyFn: (...args: I) => string | number;
  timeout: number;
  trailing?: boolean;
}): {
  debouncedFn: (...args: I) => void;
  states: DebounceStateMap;
} {
  const states: DebounceStateMap = new Map();
  const debouncedFn = async (...args: I) => {
    const key = keyFn(...args);
    const state = states.get(key);
    if (state === "timeout" || state === "trailing") {
      // Another execution is already scheduled
      return;
    } else if (state === "execute" && trailing) {
      // Currently executing, and configured for a trailing execution
      states.set(key, "trailing");
    } else {
      // Not currently executing or scheduled, schedule now
      states.set(key, "timeout");
      setTimeout(async () => {
        // timeout done, start executing
        states.set(key, "execute");
        try {
          await fn(...args);
        } finally {
          const lastState = states.get(key);
          // execution complete, mark as not executing
          states.delete(key);
          if (lastState === "trailing") {
            // but if we had a trailing execution scheduled, do that
            debouncedFn(...args);
          }
        }
      }, timeout);
    }
  };
  return { debouncedFn, states };
}

export class TagUtils {
  /** Removes `oldTag` from the frontmatter tags of `note` and replaces it with `newTag`, if any. */
  static replaceTag({
    note,
    oldTag,
    newTag,
  }: {
    note: NoteProps;
    oldTag: string;
    newTag?: string;
  }) {
    if (_.isUndefined(note.tags) || _.isString(note.tags)) {
      note.tags = newTag;
    } else {
      const index = _.findIndex(note.tags, (tag) => tag === oldTag);
      if (newTag) {
        if (index >= 0) {
          note.tags[index] = newTag;
        } else {
          // Weird, can't find the old tag. Add the new one anyway.
          note.tags.push(newTag);
        }
      } else {
        _.pull(note.tags, oldTag);
      }
    }
  }
}

export class PublishUtils {
  static getSEOPropsFromConfig(
    config: IntermediateDendronConfig
  ): Partial<SEOProps> {
    if (configIsV4(config)) {
      const {
        title,
        twitter,
        description: excerpt,
        image,
      } = ConfigUtils.getSite(config) as DendronSiteConfig;
      return { title, twitter, excerpt, image };
    } else {
      const {
        title,
        twitter,
        description: excerpt,
        image,
      } = ConfigUtils.getPublishing(config).seo;
      return { title, twitter, excerpt, image };
    }
  }

  static getSEOPropsFromNote(note: NoteProps): SEOProps {
    const { title, created, updated, image } = note;
    const { excerpt, canonicalUrl, noindex, canonicalBaseUrl, twitter } =
      note.custom ? note.custom : ({} as any);
    return {
      title,
      excerpt,
      updated,
      created,
      canonicalBaseUrl,
      canonicalUrl,
      noindex,
      image,
      twitter,
    };
  }
}

/** Makes a single property within a type optional.
 *
 * Example:
 * ```ts
 * function foo(note: Optional<NoteProps, "title">) {
 *   let title = note.title;
 *   if (title === undefined) title = "default title";
 *   // ...
 * }
 * ```
 */
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

/** Makes a single property within a type required. */
export type NonOptional<T, K extends keyof T> = Pick<Required<T>, K> &
  Omit<T, K>;

export type ConfigVaildationResp = {
  isValid: boolean;
  reason?: "client" | "config";
  minCompatClientVersion?: string;
  minCompatConfigVersion?: string;
};

export class ConfigUtils {
  static genDefaultConfig(): StrictConfigV5 {
    const common = {
      useFMTitle: true,
      useNoteTitleForLink: true,
      mermaid: true,
      useKatex: true,
      dev: {
        enablePreviewV2: true,
      },
      // site: {
      //   copyAssets: true,
      //   siteHierarchies: ["root"],
      //   siteRootDir: "docs",
      //   usePrettyRefs: true,
      //   title: "Dendron",
      //   description: "Personal knowledge space",
      //   siteLastModified: true,
      //   gh_edit_branch: "main",
      // },
    };

    return {
      version: 5,
      ...common,
      commands: genDefaultCommandConfig(),
      workspace: genDefaultWorkspaceConfig(),
      preview: genDefaultPreviewConfig(),
      publishing: genDefaultPublishingConfig(),
    } as StrictConfigV5;
  }

  // get
  static getProp<K extends keyof StrictConfigV5>(
    config: IntermediateDendronConfig,
    key: K
  ): StrictConfigV5[K] {
    const defaultConfig = ConfigUtils.genDefaultConfig();
    const configWithDefaults = _.defaultsDeep(config, defaultConfig);
    return configWithDefaults[key];
  }

  static getCommands(config: IntermediateDendronConfig): DendronCommandConfig {
    return ConfigUtils.getProp(config, "commands");
  }

  static getWorkspace(
    config: IntermediateDendronConfig
  ): DendronWorkspaceConfig {
    return ConfigUtils.getProp(config, "workspace");
  }

  static getPreview(config: IntermediateDendronConfig): DendronPreviewConfig {
    const out = ConfigUtils.getProp(config, "preview");
    // FIXME: for some reason, this can return undefined when run in context of chrome in `dendron-plugin-views`
    if (_.isUndefined(out)) {
      return ConfigUtils.genDefaultConfig().preview;
    }
    return out;
  }

  static getPublishing(
    config: IntermediateDendronConfig
  ): DendronPublishingConfig {
    return ConfigUtils.getProp(config, "publishing");
  }

  static getSite(
    config: IntermediateDendronConfig
  ): DendronSiteConfig | undefined {
    return ConfigUtils.getProp(config, "site");
  }

  // This is only used temporarily until we make migration mandatory.
  // Grabs the appropriate util for retrieving publishing configs.
  // if config is v4, grabs from site
  // if config is v5, grabs from publishing
  // if neither, v5 default is assumed by `.getPublising`
  // Use this only when both namespace refers to the property with the same name.
  static getPublishingConfig(
    config: IntermediateDendronConfig
  ): DendronPublishingConfig | DendronSiteConfig {
    return configIsV4(config)
      ? ConfigUtils.getSite(config)!
      : ConfigUtils.getPublishing(config);
  }

  static getVaults(config: IntermediateDendronConfig): DVault[] {
    return ConfigUtils.getWorkspace(config).vaults;
  }

  static getHooks(config: IntermediateDendronConfig): DHookDict | undefined {
    return ConfigUtils.getWorkspace(config).hooks;
  }

  static getJournal(config: IntermediateDendronConfig): JournalConfig {
    return ConfigUtils.getWorkspace(config).journal;
  }

  static getScratch(config: IntermediateDendronConfig): ScratchConfig {
    return ConfigUtils.getWorkspace(config).scratch;
  }

  static getTask(config: IntermediateDendronConfig): TaskConfig {
    return ConfigUtils.getWorkspace(config).task;
  }

  static getLookup(config: IntermediateDendronConfig): LookupConfig {
    return ConfigUtils.getCommands(config).lookup;
  }

  static getEnableFMTitle(
    config: IntermediateDendronConfig,
    shouldApplyPublishRules?: boolean
  ): boolean | undefined {
    return shouldApplyPublishRules
      ? ConfigUtils.getProp(config, "useFMTitle")
      : ConfigUtils.getPreview(config).enableFMTitle;
  }

  static getEnableNoteTitleForLink(
    config: IntermediateDendronConfig,
    shouldApplyPublishRules?: boolean
  ): boolean | undefined {
    return shouldApplyPublishRules
      ? ConfigUtils.getProp(config, "useNoteTitleForLink")
      : ConfigUtils.getPreview(config).enableNoteTitleForLink;
  }

  static getEnableMermaid(
    config: IntermediateDendronConfig,
    shouldApplyPublishRules?: boolean
  ): boolean | undefined {
    return shouldApplyPublishRules
      ? ConfigUtils.getProp(config, "mermaid")
      : ConfigUtils.getPreview(config).enableMermaid;
  }

  static getEnableKatex(
    config: IntermediateDendronConfig,
    shouldApplyPublishRules?: boolean
  ): boolean | undefined {
    return shouldApplyPublishRules
      ? ConfigUtils.getProp(config, "useKatex")
      : ConfigUtils.getPreview(config).enableKatex;
  }

  static getHierarchyConfig(
    config: IntermediateDendronConfig
  ): { [key: string]: HierarchyConfig } | undefined {
    if (configIsV4(config)) {
      const siteConfig = ConfigUtils.getSite(config) as DendronSiteConfig;
      return siteConfig.config as { [key: string]: HierarchyConfig };
    } else {
      return ConfigUtils.getPublishing(config).hierarchy;
    }
  }

  static getGithubConfig(config: IntermediateDendronConfig): GithubConfig {
    if (configIsV4(config)) {
      const {
        gh_edit_link,
        gh_edit_link_text,
        gh_edit_repository,
        gh_edit_branch,
        gh_edit_view_mode,
        githubCname,
      } = ConfigUtils.getSite(config) as DendronSiteConfig;
      return {
        cname: githubCname,
        // gh_edit_link is wrongly a string in old config
        enableEditLink: gh_edit_link === "true",
        editLinkText: gh_edit_link_text,
        editBranch: gh_edit_branch,
        editViewMode: gh_edit_view_mode,
        editRepository: gh_edit_repository,
      };
    } else {
      return ConfigUtils.getPublishing(config).github;
    }
  }

  static getLogo(config: IntermediateDendronConfig): string | undefined {
    return configIsV4(config)
      ? ConfigUtils.getSite(config)!.logo
      : ConfigUtils.getPublishing(config).logoPath;
  }

  static getAssetsPrefix(
    config: IntermediateDendronConfig
  ): string | undefined {
    return ConfigUtils.getPublishingConfig(config).assetsPrefix;
  }

  static getEnableContainers(
    config: IntermediateDendronConfig
  ): boolean | undefined {
    return configIsV4(config)
      ? ConfigUtils.getSite(config)?.useContainers
      : ConfigUtils.getPublishing(config).enableContainers;
  }

  static getEnableRandomlyColoredTags(
    config: IntermediateDendronConfig
  ): boolean | undefined {
    return configIsV4(config)
      ? !ConfigUtils.getSite(config)?.noRandomlyColoredTags
      : ConfigUtils.getPublishing(config).enableRandomlyColoredTags;
  }

  static getEnablePrettlyLinks(
    config: IntermediateDendronConfig
  ): boolean | undefined {
    return configIsV4(config)
      ? ConfigUtils.getSite(config)?.usePrettyLinks
      : ConfigUtils.getPublishing(config).enablePrettyLinks;
  }

  static getGATracking(config: IntermediateDendronConfig): string | undefined {
    return configIsV4(config)
      ? ConfigUtils.getSite(config)?.ga_tracking
      : ConfigUtils.getPublishing(config).ga?.tracking;
  }

  static getSiteLastModified(
    config: IntermediateDendronConfig
  ): boolean | undefined {
    return configIsV4(config)
      ? ConfigUtils.getSite(config)?.siteLastModified
      : ConfigUtils.getPublishing(config).enableSiteLastModified;
  }

  static getSiteLogoUrl(config: IntermediateDendronConfig): string | undefined {
    const assetsPrefix = ConfigUtils.getAssetsPrefix(config);
    const logo = ConfigUtils.getLogo(config);

    if (logo === undefined) return undefined;

    // Let's allow logos that are hosted off-site/in subdomains by passing in a full URL
    if (isWebUri(logo)) return logo;

    // Otherwise, this has to be an asset. It can't be anywhere else because of backwards compatibility.
    const logoBase = path.basename(logo); // Why just discard the rest of logo? Because that's what code used to do and I'm preserving backwards compatibility
    if (assetsPrefix) {
      const initialSlash = assetsPrefix.startsWith("/") ? "" : "/";
      return `${initialSlash}${assetsPrefix}/assets/${logoBase}`;
    }
    return `/assets/${logoBase}`;
  }

  static getEnablePrettyRefs(
    config: IntermediateDendronConfig,
    opts?: {
      note?: NoteProps;
      shouldApplyPublishRules?: boolean;
    }
  ): boolean | undefined {
    const override = opts?.note?.config?.global?.enablePrettyRefs;
    if (override !== undefined) return override;

    const publishRule = configIsV4(config)
      ? ConfigUtils.getSite(config)?.usePrettyRefs
      : ConfigUtils.getPublishing(config).enablePrettyRefs;

    return opts?.shouldApplyPublishRules
      ? publishRule
      : ConfigUtils.getPreview(config).enablePrettyRefs;
  }

  /**
   * NOTE: _config currently doesn't have a `global` object. We're keeping it here
   * to make using the API easier when we do add it
   */
  static getEnableChildLinks(
    _config: IntermediateDendronConfig,
    opts?: { note?: NoteProps }
  ): boolean {
    if (
      opts &&
      opts.note &&
      opts.note.config &&
      opts.note.config.global &&
      !_.isUndefined(opts.note.config.global.enableChildLinks)
    ) {
      return opts.note.config.global.enableChildLinks;
    }
    return true;
  }

  // set
  static setProp<K extends keyof StrictConfigV4>(
    config: IntermediateDendronConfig,
    key: K,
    value: StrictConfigV4[K]
  ): void {
    _.set(config, key, value);
  }

  static setCommandsProp<K extends keyof DendronCommandConfig>(
    config: IntermediateDendronConfig,
    key: K,
    value: DendronCommandConfig[K]
  ) {
    const path = `commands.${key}`;
    _.set(config, path, value);
  }

  static setWorkspaceProp<K extends keyof DendronWorkspaceConfig>(
    config: IntermediateDendronConfig,
    key: K,
    value: DendronWorkspaceConfig[K]
  ) {
    const path = `workspace.${key}`;
    _.set(config, path, value);
  }

  static setSiteProp<K extends keyof DendronSiteConfig>(
    config: IntermediateDendronConfig,
    key: K,
    value: DendronSiteConfig[K]
  ) {
    const path = `site.${key}`;
    _.set(config, path, value);
  }

  static setPublishProp<K extends keyof DendronPublishingConfig>(
    config: IntermediateDendronConfig,
    key: K,
    value: DendronPublishingConfig[K]
  ) {
    const path = `publishing.${key}`;
    _.set(config, path, value);
  }

  static overridePublishingConfig(
    config: IntermediateDendronConfig,
    value: DendronSiteConfig | DendronPublishingConfig
  ) {
    if (configIsV4(config)) {
      return {
        ...config,
        site: value,
      } as StrictConfigV4;
    } else {
      return {
        ...config,
        publishing: value,
      } as StrictConfigV5;
    }
  }

  static unsetSiteProp<K extends keyof DendronSiteConfig>(
    config: IntermediateDendronConfig,
    key: K
  ) {
    const path = `site.${key}`;
    _.unset(config, path);
  }

  static unsetPublishProp<K extends keyof DendronPublishingConfig>(
    config: IntermediateDendronConfig,
    key: K
  ) {
    const path = `publishing.${key}`;
    _.unset(config, path);
  }

  static setDuplicateNoteBehavior(
    config: IntermediateDendronConfig,
    value: DuplicateNoteBehavior | LegacyDuplicateNoteBehavior
  ): void {
    if (configIsV4(config)) {
      ConfigUtils.setSiteProp(
        config,
        "duplicateNoteBehavior",
        value as LegacyDuplicateNoteBehavior
      );
    } else {
      ConfigUtils.setPublishProp(
        config,
        "duplicateNoteBehavior",
        value as DuplicateNoteBehavior
      );
    }
  }

  static unsetDuplicateNoteBehavior(config: IntermediateDendronConfig): void {
    if (configIsV4(config)) {
      ConfigUtils.unsetSiteProp(config, "duplicateNoteBehavior");
    } else {
      ConfigUtils.unsetPublishProp(config, "duplicateNoteBehavior");
    }
  }

  static setVaults(config: IntermediateDendronConfig, value: DVault[]): void {
    ConfigUtils.setWorkspaceProp(config, "vaults", value);
  }

  static setNoteLookupProps<K extends keyof NoteLookupConfig>(
    config: IntermediateDendronConfig,
    key: K,
    value: NoteLookupConfig[K]
  ) {
    const path = `commands.lookup.note.${key}`;
    _.set(config, path, value);
  }

  static setJournalProps<K extends keyof JournalConfig>(
    config: IntermediateDendronConfig,
    key: K,
    value: JournalConfig[K]
  ) {
    const path = `workspace.journal.${key}`;
    _.set(config, path, value);
  }

  static setScratchProps<K extends keyof ScratchConfig>(
    config: IntermediateDendronConfig,
    key: K,
    value: ScratchConfig[K]
  ) {
    const path = `workspace.scratch.${key}`;
    _.set(config, path, value);
  }

  static setHooks(config: IntermediateDendronConfig, value: DHookDict) {
    ConfigUtils.setWorkspaceProp(config, "hooks", value);
  }

  static setPreviewProps<K extends keyof DendronPreviewConfig>(
    config: IntermediateDendronConfig,
    key: K,
    value: DendronPreviewConfig[K]
  ) {
    const path = `preview.${key}`;
    _.set(config, path, value);
  }

  static configIsValid(opts: {
    clientVersion: string;
    configVersion: number | undefined;
  }): ConfigVaildationResp {
    const { clientVersion, configVersion } = opts;

    if (_.isUndefined(configVersion)) {
      throw new DendronError({
        message:
          "Cannot determine config version. Please make sure the field 'version' is present and correct",
        severity: ERROR_SEVERITY.FATAL,
      });
    }

    const minCompatClientVersion =
      CONFIG_TO_MINIMUM_COMPAT_MAPPING[configVersion];

    if (_.isUndefined(minCompatClientVersion)) {
      throw new DendronError({
        message: ErrorMessages.formatShouldNeverOccurMsg(
          "Cannot find minimum compatible client version."
        ),
        severity: ERROR_SEVERITY.FATAL,
      });
    }

    const minCompatConfigVersion = _.findLastKey(
      CONFIG_TO_MINIMUM_COMPAT_MAPPING,
      (ent) => {
        return semver.lte(ent, clientVersion);
      }
    );

    if (_.isUndefined(minCompatConfigVersion)) {
      throw new DendronError({
        message: ErrorMessages.formatShouldNeverOccurMsg(
          "cannot find minimum compatible config version."
        ),
        severity: ERROR_SEVERITY.FATAL,
      });
    }

    const clientVersionCompatible = semver.lte(
      minCompatClientVersion,
      clientVersion
    );

    const configVersionCompatible =
      Number(minCompatConfigVersion) <= configVersion;

    const isValid = clientVersionCompatible && configVersionCompatible;
    if (!isValid) {
      const reason = clientVersionCompatible ? "config" : "client";
      return {
        isValid,
        reason,
        minCompatClientVersion,
        minCompatConfigVersion,
      };
    } else {
      return { isValid, minCompatClientVersion, minCompatConfigVersion };
    }
  }
}

/**
 * Make name safe for dendron
 * @param name
 * @param opts
 */
export function cleanName(name: string): string {
  name = name
    .replace(new RegExp(_.escapeRegExp(path.sep), "g"), ".")
    .toLocaleLowerCase();
  name = name.replace(/ /g, "-");
  return name;
}

/** Given a path on any platform, convert it to a unix style path. Avoid using this with absolute paths. */
export function normalizeUnixPath(fsPath: string): string {
  return path.posix.format(path.parse(fsPath));
}

/** Wrapper(s) for easier testing, to wrap functions where we don't want to mock the global function. */
export class Wrap {
  /** A useless wrapper around `setTimeout`. Useful for testing.
   *
   * If you are testing code that uses `setTimeout`, you can switch that code over to this wrapper instead,
   * and then mock the wrapper. We can't entirely mock `setTimeout` because that seems to break VSCode.
   */
  static setTimeout(
    callback: (...args: any[]) => void,
    ms: number,
    ...args: any[]
  ) {
    return setTimeout(callback, ms, ...args);
  }
}
