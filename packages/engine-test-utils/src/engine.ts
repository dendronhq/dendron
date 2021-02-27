import { DEngineClientV2, DVault, WorkspaceOpts } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import {
  ENGINE_HOOKS,
  RunEngineTestFunctionV4,
  runJestHarnessV2,
  SetupHookFunction,
} from "@dendronhq/common-test-utils";
import { LaunchEngineServerCommand } from "@dendronhq/dendron-cli";
import {
  createEngine as engineServerCreateEngine,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";

export type AsyncCreateEngineFunction = (
  opts: WorkspaceOpts
) => Promise<DEngineClientV2>;

/**
 * Create an {@link DendronEngine}
 */
export async function createEngineFromEngine(opts: WorkspaceOpts) {
  return engineServerCreateEngine(opts) as DEngineClientV2;
}

export { DEngineClientV2, DVault, WorkspaceOpts };

/**
 * Create an {@link DendronEngineClient}
 */
export async function createEngineFromServer(opts: WorkspaceOpts) {
  const { engine } = await new LaunchEngineServerCommand().enrichArgs({
    wsRoot: opts.wsRoot,
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

export type RunEngineTestV5Opts = {
  preSetupHook?: SetupHookFunction;
  createEngine?: AsyncCreateEngineFunction;
  extra?: any;
  expect: any;
  vaults?: DVault[];
  setupOnly?: boolean;
};
export async function runEngineTestV5(
  func: RunEngineTestFunctionV4,
  opts: RunEngineTestV5Opts
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
  const engine: DEngineClientV2 = await createEngine({ wsRoot, vaults });
  const initResp = await engine.init();
  const testOpts = { wsRoot, vaults, engine, initResp, extra, config: engine };
  if (opts.setupOnly) {
    return testOpts;
  }
  const results = (await func(testOpts)) || [];
  await runJestHarnessV2(results, expect);
  return { opts: testOpts, resp: undefined };
}

export function testWithEngine(
  prompt: string,
  func: RunEngineTestFunctionV4,
  opts?: Omit<RunEngineTestV5Opts, "expect"> & { only?: boolean }
) {
  if (opts?.only) {
    test.only(prompt, async () => {
      await runEngineTestV5(func, {
        preSetupHook: ENGINE_HOOKS.setupBasic,
        ...opts,
        expect,
      });
    });
  } else {
    test(prompt, async () => {
      await runEngineTestV5(func, {
        preSetupHook: ENGINE_HOOKS.setupBasic,
        ...opts,
        expect,
      });
    });
  }
}
