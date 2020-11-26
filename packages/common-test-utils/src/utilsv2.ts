import _ from "lodash";
import {
  CreateEngineFunction,
  EngineTestUtilsV4,
  RunEngineTestFunctionV4,
  runJestHarnessV2,
} from ".";
import {
  PostSetupHookFunction,
  PreSetupHookFunction,
  SetupHookFunction,
} from "./types";

export class TestPresetEntryV4 {
  public preSetupHook: PreSetupHookFunction;
  public postSetupHook: PostSetupHookFunction;
  public testFunc: RunEngineTestFunctionV4;
  public extraOpts: any;

  constructor(
    func: RunEngineTestFunctionV4,
    opts?: {
      preSetupHook?: PreSetupHookFunction;
      postSetupHook?: PostSetupHookFunction;
      extraOpts?: any;
    }
  ) {
    let { preSetupHook, postSetupHook, extraOpts } = opts || {};
    this.preSetupHook = preSetupHook ? preSetupHook : async () => {};
    this.postSetupHook = postSetupHook ? postSetupHook : async () => {};
    this.testFunc = func;
    this.extraOpts = extraOpts;
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
  // const resp = await postSetupHook({wsRoot, vaults, engine})
  const results = await func({
    wsRoot,
    vaults,
    engine,
    initResp,
    extra,
  });

  await runJestHarnessV2(results, expect);
}
