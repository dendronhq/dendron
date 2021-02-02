import { DEngineClientV2, DVault, WorkspaceOpts } from "@dendronhq/common-all";
import { launch } from "@dendronhq/api-server";
import { tmpDir } from "@dendronhq/common-server";
import {
  RunEngineTestFunctionV4,
  runJestHarnessV2,
  SetupHookFunction,
} from "@dendronhq/common-test-utils";
import {
  createEngine as engineServerCreateEngine,
  DendronEngineClient,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";

export type AsyncCreateEngineFunction = (
  opts: WorkspaceOpts
) => Promise<DEngineClientV2>;

export async function createEngineFromEngine(opts: WorkspaceOpts) {
  return engineServerCreateEngine(opts);
}

export { DEngineClientV2, DVault, WorkspaceOpts };

export async function createEngineFromServer(opts: WorkspaceOpts) {
  const port = await launch({});
  const engine: DEngineClientV2 = DendronEngineClient.create({
    port,
    vaultsv4: opts.vaults,
    ws: opts.wsRoot,
    vaults: [],
  });
  await engine.init();
  return engine;
}

async function setupWS(opts: { vaults: DVault[] }) {
  const wsRoot = tmpDir().name;
  const ws = new WorkspaceService({ wsRoot });
  const vaults = await Promise.all(
    opts.vaults.map(async (vault) => {
      await ws.createVault({ vault });
      return vault;
    })
  );
  return { wsRoot, vaults };
}

// @ts-ignore
export async function runEngineTestV5<TExtra = any>(
  func: RunEngineTestFunctionV4,
  opts: {
    preSetupHook?: SetupHookFunction;
    //postSetupHook?: PostSetupHookFunction;
    createEngine?: AsyncCreateEngineFunction;
    extra?: TExtra;
    expect: any;
    vaults?: DVault[];
    setupOnly?: boolean;
  }
): Promise<any> {
  const { preSetupHook, extra, vaults, createEngine } = _.defaults(opts, {
    preSetupHook: async ({}) => {},
    postSetupHook: async ({}) => {},
    createEngine: createEngineFromEngine,
    extra: {},
    vaults: [{ fsPath: "vault1" }, { fsPath: "vault2" }],
  });
  const { wsRoot } = await setupWS({ vaults });
  await preSetupHook({ wsRoot, vaults });
  const engine = await createEngine({ wsRoot, vaults });
  const initResp = await engine.init();
  const testOpts = { wsRoot, vaults, engine, initResp, extra };
  if (opts.setupOnly) {
    return testOpts;
  }
  const results = (await func(testOpts)) || [];
  await runJestHarnessV2(results, expect);
  return { opts: testOpts, resp: undefined };
}
