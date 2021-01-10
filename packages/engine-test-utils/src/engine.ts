import { tmpDir } from "@dendronhq/common-server";
import {
  CreateEngineFunction,
  RunEngineTestFunctionV4,
  runJestHarnessV2,
  SetupHookFunction,
} from "@dendronhq/common-test-utils";
import {
  createEngine as defaultCreateEngine,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";

async function setupWS(opts: { singleVault?: boolean }) {
  const wsRoot = tmpDir().name;
  const defaultVaults = opts?.singleVault ? ["vault1"] : ["vault1", "vault2"];
  const ws = new WorkspaceService({ wsRoot });
  const vaults = await Promise.all(
    defaultVaults.map(async (fsPath) => {
      const vault = { fsPath };
      await ws.createVault({ vault });
      return vault;
    })
  );
  return { wsRoot, vaults };
}

export async function runEngineTestV5<TExtra = any>(
  func: RunEngineTestFunctionV4,
  opts: {
    preSetupHook?: SetupHookFunction;
    //postSetupHook?: PostSetupHookFunction;
    createEngine?: CreateEngineFunction;
    extra?: TExtra;
    expect: any;
    setupOnly?: boolean;
    singleVault?: boolean;
  }
) {
  const { preSetupHook, extra, singleVault, createEngine } = _.defaults(opts, {
    preSetupHook: async ({}) => {},
    postSetupHook: async ({}) => {},
    createEngine: defaultCreateEngine,
    extra: {},
  });
  const { wsRoot, vaults } = await setupWS({ singleVault });
  await preSetupHook({ wsRoot, vaults });
  const engine = createEngine({ wsRoot, vaults });
  const initResp = await engine.init();
  const testOpts = { wsRoot, vaults, engine, initResp, extra };
  if (opts.setupOnly) {
    return testOpts;
  }
  const results = (await func(testOpts)) || [];
  await runJestHarnessV2(results, expect);
  return { opts: testOpts, resp: undefined };
}
