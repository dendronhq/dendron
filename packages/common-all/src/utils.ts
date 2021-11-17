import GithubSlugger from "github-slugger";
import _ from "lodash";
import minimatch from "minimatch";
import querystring from "querystring";
import semver from "semver";
import { COLORS_LIST } from "./colors";
import {
  NoteProps,
  SEOProps,
  DVault,
  DHookDict,
  DendronSiteConfig,
} from "./types";
import { TaskConfig } from "./types/configs/workspace/task";
import {
  DendronCommandConfig,
  DendronWorkspaceConfig,
  genDefaultCommandConfig,
  genDefaultWorkspaceConfig,
  IntermediateDendronConfig,
  JournalConfig,
  ScratchConfig,
  LookupConfig,
  StrictConfigV4,
  NoteLookupConfig,
  genDefaultPreviewConfig,
  DendronPreviewConfig,
} from "./types/intermediateConfigs";

/**
 * Dendron utilities
 */
export class DUtils {
  static minimatch = minimatch;
  static semver = semver;
  static querystring = querystring;

  /**
   * Check if string is numeric
   * Credit to https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
   * @param str
   * @returns
   */
  static isNumeric(str: string) {
    if (typeof str != "string") return false; // we only process strings!
    return (
      // @ts-ignore
      !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
      !isNaN(parseFloat(str))
    ); // ...and ensure strings of whitespace fail
  }
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
  return !isNaN(parseInt(n)) && isFinite(n);
};

export function isBlockAnchor(anchor?: string): boolean {
  // not undefined, not an empty string, and the first character is ^
  return !!anchor && anchor[0] === "^";
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
    const { title, twitter, description: excerpt } = config.site;
    return {
      title,
      twitter,
      excerpt,
    };
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

export class ConfigUtils {
  static genDefaultConfig(): StrictConfigV4 {
    const common = {
      useFMTitle: true,
      useNoteTitleForLink: true,
      mermaid: true,
      useKatex: true,
      usePrettyRefs: true,
      dev: {
        enablePreviewV2: true,
      },
      site: {
        copyAssets: true,
        siteHierarchies: ["root"],
        siteRootDir: "docs",
        usePrettyRefs: true,
        title: "Dendron",
        description: "Personal knowledge space",
        siteLastModified: true,
        gh_edit_branch: "main",
      },
    };

    return {
      version: 4,
      ...common,
      commands: genDefaultCommandConfig(),
      workspace: genDefaultWorkspaceConfig(),
      preview: genDefaultPreviewConfig(),
    } as StrictConfigV4;
  }

  // get
  static getProp<K extends keyof StrictConfigV4>(
    config: IntermediateDendronConfig,
    key: K
  ): StrictConfigV4[K] {
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
    return ConfigUtils.getProp(config, "preview");
  }

  static getSite(config: IntermediateDendronConfig): DendronSiteConfig {
    return ConfigUtils.getProp(config, "site");
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
}
