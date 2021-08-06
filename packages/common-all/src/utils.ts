import minimatch from "minimatch";
import semver from "semver";
import GithubSlugger from "github-slugger";
import querystring from "querystring";
import _ from "lodash";
import { COLORS_LIST } from "./colors";
import { NoteProps } from "./types";

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
