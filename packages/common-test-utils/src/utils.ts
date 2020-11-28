import {
  DEngineClientV2,
  DEngineInitRespV2,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import assert from "assert";
import _ from "lodash";
import { EngineTestUtilsV3, NotePresetsUtils } from ".";
import { PostSetupHookFunction, SetupHookFunction, TestResult } from "./types";

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
}

export abstract class EngineTest<TPreSetupOut = any, TPostSetupOut = any> {
  public preSetupHook: SetupHookFunction<TPreSetupOut>;
  public postSetupHook: SetupHookFunction<TPostSetupOut>;
  public engine: DEngineClientV2;

  constructor(opts: {
    preSetupHook?: SetupHookFunction<TPreSetupOut>;
    postSetupHook?: SetupHookFunction<TPostSetupOut>;
    engine: DEngineClientV2;
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
  return _.map(await results, (ent) =>
    expect(ent.actual).toEqual(ent.expected)
  );
}

export type RunEngineTestFunctionOpts = {
  engine: DEngineClientV2;
  initResp: DEngineInitRespV2;
} & WorkspaceOpts;

export type RunEngineTestFunction = (
  opts: RunEngineTestFunctionOpts
) => Promise<any>;

export type RunEngineTestFunctionV4 = (
  opts: RunEngineTestFunctionOpts & { extra?: any }
) => Promise<TestResult[]>;

export type SetupTestFunctionV4 = (
  opts: RunEngineTestFunctionOpts & { extra?: any }
) => Promise<any>;

export type GenTestResults = (
  opts: RunEngineTestFunctionOpts & { extra?: any }
) => Promise<TestResult[]>;

export type CreateEngineFunction = (opts: WorkspaceOpts) => DEngineClientV2;

export async function runEngineTest(
  func: RunEngineTestFunction,
  opts: {
    preSetupHook?: SetupHookFunction;
    postSetupHook?: PostSetupHookFunction;
    createEngine: CreateEngineFunction;
  }
) {
  const { preSetupHook, createEngine } = _.defaults(opts, {
    preSetupHook: async ({}) => {},
    postSetupHook: async ({}) => {},
  });

  const wsRoot = tmpDir().name;
  const vaults = await EngineTestUtilsV3.setupVaults({
    initVault1: async (vaultDir: string) => {
      await NotePresetsUtils.createBasic({ vaultDir, fname: "foo" });
    },
    initVault2: async (vaultDir: string) => {
      await NotePresetsUtils.createBasic({ vaultDir, fname: "bar" });
    },
  });
  await preSetupHook({ wsRoot, vaults });
  const engine = createEngine({ wsRoot, vaults });
  const initResp = await engine.init();
  await func({ wsRoot, vaults, engine, initResp });
}
