/* eslint-disable no-throw-literal */
import {
  DEngineClient,
  DEngineInitResp,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import assert from "assert";
import _ from "lodash";
import { SetupHookFunction, TestResult } from "../types";

export * from "./assert";
export const toPlainObject = <R>(value: unknown): R =>
  value !== undefined ? JSON.parse(JSON.stringify(value)) : value;

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
    this.before = before || (async () => {});
    this.preSetupHook = preSetupHook || (async () => {});
    this.postSetupHook = postSetupHook || (async () => {});
    this.after = after || (async () => {});
    this.init = async () => {};
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
