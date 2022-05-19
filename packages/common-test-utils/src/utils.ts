import {
  DEngineClient,
  DEngineInitResp,
  NotePropsByIdDict,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import assert from "assert";
import _ from "lodash";
import { SetupHookFunction, TestResult } from "./types";

export const toPlainObject = <R>(value: unknown): R =>
  value !== undefined ? JSON.parse(JSON.stringify(value)) : value;

export class AssertUtils {
  static async assertInString({
    body,
    match,
    nomatch,
  }: {
    body: string;
    match?: (string | RegExp)[];
    nomatch?: (string | RegExp)[];
  }): Promise<boolean> {
    await this.assertTimesInString({
      body,
      // match must appear more than 0 times (at least once) in the body
      moreThan: match?.map((v) => [0, v]),
      // nomatch must appear fewer than 1 times (never) in the body
      fewerThan: nomatch?.map((v) => [1, v]),
    });
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
        if (foundCount != count) {
          throw Error(
            `${match} found ${foundCount} times, expected equal to ${count} in ${body}`
          );
        }
        return true;
      })
    );
    await Promise.all(
      (fewerThan || []).map(([count, match]) => {
        const foundCount = countMatches(match);
        if (foundCount >= count) {
          throw Error(
            `${match} found ${foundCount} times, expected fewer than ${count} in ${body}`
          );
        }
        return true;
      })
    );
    await Promise.all(
      (moreThan || []).map(([count, match]) => {
        const foundCount = countMatches(match);
        if (foundCount <= count) {
          throw Error(
            `${match} found ${foundCount} times, expected more than ${count} in ${body}`
          );
        }
        return true;
      })
    );
    return true;
  }
}

export class TestPresetEntry<
  TBeforeOpts,
  TAfterOpts = any,
  TResultsOpts = any
> {
  public label: string;
  public beforeTestResults: (_opts: TBeforeOpts) => Promise<any>;
  /**
   * Run this before setting up workspace
   */
  public preSetupHook: SetupHookFunction;
  /**
   * Run this before setting up hooks
   */
  public postSetupHook: SetupHookFunction;
  public after: (_opts: TAfterOpts) => Promise<any>;
  public results: (_opts: TResultsOpts) => Promise<TestResult[]>;
  public init: () => Promise<void>;
  public notes: NotePropsByIdDict = {};

  constructor({
    label,
    results,
    beforeTestResults,
    after,
    preSetupHook,
    postSetupHook,
  }: {
    label: string;
    preSetupHook?: SetupHookFunction;
    postSetupHook?: SetupHookFunction;
    beforeSetup?: (_opts: TBeforeOpts) => Promise<any>;
    beforeTestResults?: (_opts: TBeforeOpts) => Promise<any>;
    after?: (_opts: TAfterOpts) => Promise<any>;
    results: (_opts: TResultsOpts) => Promise<TestResult[]>;
  }) {
    this.label = label;
    this.results = results;
    this.beforeTestResults = beforeTestResults || (async () => {});
    this.preSetupHook = preSetupHook || (async () => {});
    this.postSetupHook = postSetupHook || (async () => {});
    this.after = after || (async () => {});
    this.init = async () => {};
    this.preSetupHook = _.bind(this.preSetupHook, this);
  }
}

export async function runMochaHarness<TOpts>(results: any, opts?: TOpts) {
  return _.map(await results(opts), (ent) =>
    assert.deepStrictEqual(ent.actual, ent.expected)
  );
}

export async function runJestHarnessV2(results: any, expect: any) {
  return _.map(await results, (ent) => {
    if (_.isBoolean(ent.expected) && ent.expected === true) {
      expect(ent.actual).toBeTruthy();
    } else {
      expect(ent.actual).toEqual(ent.expected);
    }
  });
}

export type RunEngineTestFunctionOpts = {
  engine: DEngineClient;
  initResp: DEngineInitResp;
} & WorkspaceOpts;

export type RunEngineTestFunction = (
  opts: RunEngineTestFunctionOpts
) => Promise<any>;

/**
 * Used to test a function. If this test is meant to be run
 * both for `mocha` and `jest`, return a `TestResult` object.
 * Otherwise, use the default assertion library of
 * your current test runner
 */
export type RunEngineTestFunctionV4<T = any, TExtra = any> = (
  opts: RunEngineTestFunctionOpts & { extra?: TExtra }
) => Promise<TestResult[] | void | T>;

export type SetupTestFunctionV4 = (
  opts: RunEngineTestFunctionOpts & { extra?: any }
) => Promise<any>;

export type GenTestResults = (
  opts: RunEngineTestFunctionOpts & { extra?: any }
) => Promise<TestResult[]>;

export type CreateEngineFunction = (opts: WorkspaceOpts) => DEngineClient;
