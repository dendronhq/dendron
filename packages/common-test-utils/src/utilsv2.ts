import { DEngineClientV2, WorkspaceOpts } from "@dendronhq/common-all";
import _ from "lodash";
import {
  CreateEngineFunction,
  EngineTestUtilsV4,
  RunEngineTestFunctionV4,
  runJestHarnessV2,
  SetupTestFunctionV4,
  GenTestResults,
} from ".";
import {
  PostSetupHookFunction,
  PreSetupHookFunction,
  SetupHookFunction,
} from "./types";

type EngineOverride = {
  [P in keyof DEngineClientV2]: (opts: WorkspaceOpts) => DEngineClientV2[P];
};

export const createEngineFactoryFactory = ({
  overrides,
  EngineClass,
}: {
  EngineClass: any;
  overrides?: Partial<EngineOverride>;
}): CreateEngineFunction => {
  const createEngine: CreateEngineFunction = (
    opts: WorkspaceOpts
  ): DEngineClientV2 => {
    const engine = new EngineClass() as DEngineClientV2;
    _.map(overrides || {}, (method, key: keyof DEngineClientV2) => {
      // @ts-ignore
      engine[key] = method(opts);
    });
    return engine;
  };
  return createEngine;
};

class MockEngineClass {
  async init() {}
}
export const createMockEngine = createEngineFactoryFactory({
  EngineClass: MockEngineClass,
});

export class TestPresetEntryV4 {
  public preSetupHook: PreSetupHookFunction;
  public postSetupHook: PostSetupHookFunction;
  public testFunc: RunEngineTestFunctionV4;
  public extraOpts: any;
  public setupTest?: SetupTestFunctionV4;
  public genTestResults?: GenTestResults;

  constructor(
    func: RunEngineTestFunctionV4,
    opts?: {
      preSetupHook?: PreSetupHookFunction;
      postSetupHook?: PostSetupHookFunction;
      extraOpts?: any;
      setupTest?: SetupTestFunctionV4;
      genTestResults?: GenTestResults;
    }
  ) {
    let { preSetupHook, postSetupHook, extraOpts, setupTest, genTestResults } =
      opts || {};
    this.preSetupHook = preSetupHook ? preSetupHook : async () => {};
    this.postSetupHook = postSetupHook ? postSetupHook : async () => {};
    this.testFunc = _.bind(func, this);
    this.extraOpts = extraOpts;
    this.setupTest = setupTest;
    this.genTestResults = _.bind(
      genTestResults ? genTestResults : async () => [],
      this
    );
    //_.bindAll(this, ['genTestResults'])
  }
}

/**
 * Run engine test with relative vaults
 */
export async function runEngineTestV4(
  func: RunEngineTestFunctionV4,
  opts: {
    preSetupHook?: SetupHookFunction;
    postSetupHook?: PostSetupHookFunction;
    createEngine: CreateEngineFunction;
    extra?: any;
    expect: any;
    setupOnly?: boolean;
  }
) {
  const { preSetupHook, createEngine, extra } = _.defaults(opts, {
    preSetupHook: async ({}) => {},
    postSetupHook: async ({}) => {},
    extra: {},
  });

  const { wsRoot, vaults } = await EngineTestUtilsV4.setupWS();

  await preSetupHook({ wsRoot, vaults: vaults });
  const engine = createEngine({ wsRoot, vaults: vaults });
  const initResp = await engine.init();
  const testOpts = { wsRoot, vaults, engine, initResp, extra };
  if (opts.setupOnly) {
    if (!opts.preSetupHook) {
      throw Error("no pre setup hook");
    }
    return { opts: testOpts, resp: opts.preSetupHook(testOpts) };
  }
  // const resp = await postSetupHook({wsRoot, vaults, engine})
  const results = (await func(testOpts)) || [];

  await runJestHarnessV2(results, expect);
  return { opts: testOpts, resp: undefined };
}
