import {
  CleanDendronSiteConfig,
  CONSTANTS,
  DEngineClient,
  DVault,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  tmpDir,
  vault2Path,
} from "@dendronhq/common-server";
import {
  ENGINE_HOOKS,
  RunEngineTestFunctionOpts,
  RunEngineTestFunctionV4,
  runJestHarnessV2,
  SetupHookFunction,
  TestResult,
} from "@dendronhq/common-test-utils";
import { LaunchEngineServerCommand } from "@dendronhq/dendron-cli";
import {
  createEngine as engineServerCreateEngine,
  DConfig,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { GitTestUtils } from "./utils";
import fs from "fs-extra";
import path from "path";

export type AsyncCreateEngineFunction = (
  opts: WorkspaceOpts
) => Promise<DEngineClient>;

/**
 * Create an {@link DendronEngine}
 */
export async function createEngineFromEngine(opts: WorkspaceOpts) {
  return engineServerCreateEngine(opts) as DEngineClient;
}

export { DEngineClient, DVault, WorkspaceOpts };

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

export async function setupWS(opts: { vaults: DVault[] }) {
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
  initGit?: boolean;
  initHooks?: boolean;
};

export type RunEngineTestFunctionV5<T = any> = (
  opts: RunEngineTestFunctionOpts & { extra?: any; engineInitDuration: number }
) => Promise<TestResult[] | void | T>;

/**
 *
 * @param func
 * @param opts.vaults: By default, initiate 3 vaults {vault1, vault2, (vault3, "vaultThree")}
 * @param opts.preSetupHook: By default, initiate empty
 * @returns
 */
export async function runEngineTestV5(
  func: RunEngineTestFunctionV5,
  opts: RunEngineTestV5Opts
): Promise<any> {
  const { preSetupHook, extra, vaults, createEngine, initGit } = _.defaults(
    opts,
    {
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
    }
  );
  const { wsRoot } = await setupWS({ vaults });
  if (opts.initHooks) {
    fs.mkdirSync(path.join(wsRoot, CONSTANTS.DENDRON_HOOKS_BASE));
  }
  await preSetupHook({ wsRoot, vaults });
  const engine: DEngineClient = await createEngine({ wsRoot, vaults });
  const start = process.hrtime();
  const initResp = await engine.init();
  const engineInitDuration = getDurationMilliseconds(start);
  const testOpts = {
    wsRoot,
    vaults,
    engine,
    initResp,
    extra,
    config: engine,
    engineInitDuration,
  };
  if (initGit) {
    await GitTestUtils.createRepoForWorkspace(wsRoot);
    await Promise.all(
      vaults.map((vault) => {
        return GitTestUtils.createRepoWithReadme(vault2Path({ vault, wsRoot }));
      })
    );
  }
  if (opts.setupOnly) {
    return testOpts;
  }
  const results = (await func(testOpts)) || [];
  await runJestHarnessV2(results, expect);
  return { opts: testOpts, resp: undefined, wsRoot };
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

export class TestEngineUtils {
  static vault1(vaults: DVault[]) {
    return _.find(vaults, { fsPath: "vault1" })!;
  }
}
