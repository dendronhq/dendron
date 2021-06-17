import {
  DEngineClient,
  DEngineInitResp,
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
    match?: string[];
    nomatch?: string[];
  }): Promise<boolean> {
    await Promise.all(
      (match || []).map((m) => {
        if (body.indexOf(m) < 0) {
          throw `${m} not found in ${body}`;
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
        if (foundCount != count) {
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

  static async assertRegexInString({
    body,
    match,
    nomatch,
  }: {
    body: string;
    match?: (string | RegExp)[];
    nomatch?: (string | RegExp)[];
  }): Promise<boolean> {
    return await this.assertTimesInString({
      body,
      moreThan: [
        ...(match?.map((pattern): [number, string | RegExp] => [0, pattern]) ||
          []),
      ],
      fewerThan: [
        ...(nomatch?.map((pattern): [number, string | RegExp] => [
          1,
          pattern,
        ]) || []),
      ],
    });
  }
}

export abstract class EngineTest<TPreSetupOut = any, TPostSetupOut = any> {
  public preSetupHook: SetupHookFunction<TPreSetupOut>;
  public postSetupHook: SetupHookFunction<TPostSetupOut>;
  public engine: DEngineClient;

  constructor(opts: {
    preSetupHook?: SetupHookFunction<TPreSetupOut>;
    postSetupHook?: SetupHookFunction<TPostSetupOut>;
    engine: DEngineClient;
  }) {
    const { preSetupHook, postSetupHook, engine } = _.defaults(opts, {
      preSetupHook: async () => {},
      postSetupHook: async () => {},
    });
    this.preSetupHook = preSetupHook;
    this.postSetupHook = postSetupHook;
    this.engine = engine;
  }

  runJest = () => {};
  runMocha = () => {};
}

export class TestPresetEntry<TBeforeOpts, TAfterOpts, TResultsOpts> {
  public label: string;
  public before: (_opts: TBeforeOpts) => Promise<any>;
  public preSetupHook: SetupHookFunction;
  public postSetupHook: SetupHookFunction;
  public after: (_opts: TAfterOpts) => Promise<any>;
  public results: (_opts: TResultsOpts) => Promise<TestResult[]>;
  public init: () => Promise<void>;

  constructor({
    label,
    results,
    before,
    after,
    preSetupHook,
    postSetupHook,
  }: {
    label: string;
    preSetupHook?: SetupHookFunction;
    postSetupHook?: SetupHookFunction;
    beforeSetup?: (_opts: TBeforeOpts) => Promise<any>;
    before?: (_opts: TBeforeOpts) => Promise<any>;
    after?: (_opts: TAfterOpts) => Promise<any>;
    results: (_opts: TResultsOpts) => Promise<TestResult[]>;
  }) {
    this.label = label;
    this.results = results;
    this.before = before ? before : async () => {};
    this.preSetupHook = preSetupHook ? preSetupHook : async () => {};
    this.postSetupHook = postSetupHook ? postSetupHook : async () => {};
    this.after = after ? after : async () => {};
    this.init = async () => {};
  }
}

export async function runMochaHarness<TOpts>(results: any, opts?: TOpts) {
  return _.map(await results(opts), (ent) =>
    assert.deepStrictEqual(ent.actual, ent.expected)
  );
}

export async function runJestHarness<TOpts>(
  results: any,
  expect: jest.Expect,
  opts?: TOpts
) {
  return _.map(await results(opts), (ent) =>
    expect(ent.actual).toEqual(ent.expected)
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
export type RunEngineTestFunctionV4<T = any> = (
  opts: RunEngineTestFunctionOpts & { extra?: any }
) => Promise<TestResult[] | void | T>;

export type SetupTestFunctionV4 = (
  opts: RunEngineTestFunctionOpts & { extra?: any }
) => Promise<any>;

export type GenTestResults = (
  opts: RunEngineTestFunctionOpts & { extra?: any }
) => Promise<TestResult[]>;

export type CreateEngineFunction = (opts: WorkspaceOpts) => DEngineClient;
