/* eslint-disable no-throw-literal */
import fs from "fs";
import _ from "lodash";

export class AssertUtils {
  static assertInFile({
    fpath,
    match,
    nomatch,
  }: {
    fpath: string;
    match?: string[];
    nomatch?: string[];
  }) {
    const body = fs.readFileSync(fpath, { encoding: "utf8" });
    return AssertUtils.assertInString({ body, match, nomatch });
  }

  static async assertInString({
    body,
    match,
    nomatch,
  }: {
    body: string;
    match?: string[];
    nomatch?: string[];
  }): Promise<boolean> {
    await Promise.all(
      (match || []).map((m) => {
        if (body.indexOf(m) < 0) {
          throw `${m} not found\n. Original text:\n ${body}`;
        }
        return true;
      })
    );
    await Promise.all(
      (nomatch || []).map((m) => {
        if (body.indexOf(m) > 0) {
          throw `${m} found in ${body}`;
        }
        return true;
      })
    );
    return true;
  }

  /** Asserts that the gives strings appear the expected number of times in this string.
   *
   * parameters `match`, `fewerThan`, and `moreThan` should look like:
   *     [ [2, "Lorem ipsum"], [1, "foo bar"] ]
   *
   * @param match Must appear exactly this many times.
   * @param fewerThan Must appear fewer than this many times.
   * @param moreThan Must appear more than this many times.
   */
  static async assertTimesInString({
    body,
    match,
    fewerThan,
    moreThan,
  }: {
    body: string;
    match?: [number, string | RegExp][];
    fewerThan?: [number, string | RegExp][];
    moreThan?: [number, string | RegExp][];
  }): Promise<boolean> {
    function countMatches(match: string | RegExp) {
      if (typeof match === "string") {
        match = _.escapeRegExp(match);
      }
      const matches = body.match(new RegExp(match, "g")) || [];
      return matches.length;
    }
    await Promise.all(
      (match || []).map(([count, match]) => {
        const foundCount = countMatches(match);
        if (foundCount !== count) {
          throw `${match} found ${foundCount} times, expected equal to ${count} in ${body}`;
        }
        return true;
      })
    );
    await Promise.all(
      (fewerThan || []).map(([count, match]) => {
        const foundCount = countMatches(match);
        if (foundCount >= count) {
          throw `${match} found ${foundCount} times, expected fewer than ${count} in ${body}`;
        }
        return true;
      })
    );
    await Promise.all(
      (moreThan || []).map(([count, match]) => {
        const foundCount = countMatches(match);
        if (foundCount <= count) {
          throw `${match} found ${foundCount} times, expected more than ${count} in ${body}`;
        }
        return true;
      })
    );
    return true;
  }
}
