import {
  CleanDendronSiteConfig,
  DEngineClientV2,
  DVault,
  WorkspaceOpts,
} from "@dendronhq/common-all";
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
  DConfig,
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
 * Create a server
 * @param opts
 * @returns
 */
export async function createServer(opts: WorkspaceOpts) {
  return await new LaunchEngineServerCommand().enrichArgs({
    wsRoot: opts.wsRoot,
  });
}

/**
 * Create an {@link DendronEngineClient}
 */
export async function createEngineFromServer(opts: WorkspaceOpts) {
  const { engine } = await createServer(opts);
  await engine.init();
  return engine;
}

export function createSiteConfig(
  opts: Partial<CleanDendronSiteConfig> &
    Required<Pick<CleanDendronSiteConfig, "siteRootDir" | "siteHierarchies">>
): CleanDendronSiteConfig {
  let copts = {
    siteNotesDir: "docs",
    siteUrl: "https://localhost:8080",
    ...opts,
  };
  return {
    ...copts,
    siteIndex: DConfig.getSiteIndex(copts),
  };
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
    // third vault has diff name
    vaults: [
      { fsPath: "vault1" },
      { fsPath: "vault2" },
      { fsPath: "vault3", name: "vaultThree" },
    ],
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
    return test.only(prompt, async () => {
      await runEngineTestV5(func, {
        preSetupHook: ENGINE_HOOKS.setupBasic,
        ...opts,
        expect,
      });
    });
  } else {
    return test(prompt, async () => {
      await runEngineTestV5(func, {
        preSetupHook: ENGINE_HOOKS.setupBasic,
        ...opts,
        expect,
      });
    });
  }
}
