import {
  CleanDendronSiteConfig,
  CONSTANTS,
  DEngineClient,
  DVault,
  DWorkspace,
  WorkspaceFolderRaw,
  WorkspaceOpts,
  WorkspaceSettings,
  DendronConfig,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  tmpDir,
  vault2Path,
} from "@dendronhq/common-server";
import {
  GenTestResults,
  PostSetupHookFunction,
  PreSetupHookFunction,
  RunEngineTestFunctionOpts,
  RunEngineTestFunctionV4,
  runJestHarnessV2,
  SetupHookFunction,
  SetupTestFunctionV4,
  sinon,
  TestResult,
} from "@dendronhq/common-test-utils";
import { LaunchEngineServerCommand } from "@dendronhq/dendron-cli";
import {
  createEngine as engineServerCreateEngine,
  DConfig,
  WorkspaceService,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ENGINE_HOOKS } from "./presets";
import { GitTestUtils } from "./utils";
import os from "os";

export type TestSetupWorkspaceOpts = {
  /**
   * Vaults to initialize engine with
   * Defaults to following if not set
   * [
   *    { fsPath: "vault1" },
   *    { fsPath: "vault2" },
   *    { fsPath: "vault3", name: "vaultThree" },
   *  ]
   */
  vaults?: DVault[];
  /**
   * Modify dendron config before initialization
   */
  modConfigCb?: (config: DendronConfig) => DendronConfig;
};

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
// @ts-ignore
export async function createServer(opts: WorkspaceOpts): any {
  return await new LaunchEngineServerCommand().enrichArgs({
    wsRoot: opts.wsRoot,
  });
}

/**
 * Create an {@link DendronEngineClient}
 */
export async function createEngineFromServer(
  opts: WorkspaceOpts
): Promise<any> {
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

/**
 *
 * @param opts.asRemote: add git repo
 * @param opts.wsRoot: override given wsRoot
 * @returns
 */
export async function setupWS(opts: {
  vaults: DVault[];
  workspaces?: DWorkspace[];
  asRemote?: boolean;
  wsRoot?: string;
}) {
  const wsRoot = opts.wsRoot || tmpDir().name;
  const ws = new WorkspaceService({ wsRoot });
  ws.createConfig();
  const config = ws.config;
  let vaults = await Promise.all(
    opts.vaults.map(async (vault) => {
      await ws.createVault({ vault, config, updateConfig: false });
      return vault;
    })
  );
  config.vaults = _.sortBy(config.vaults, "fsPath");
  if (config.site.duplicateNoteBehavior) {
    config.site.duplicateNoteBehavior.payload = (
      config.site.duplicateNoteBehavior.payload as string[]
    ).sort();
  }
  ws.setConfig(config);
  if (opts.workspaces) {
    const vaultsFromWs = await _.reduce(
      opts.workspaces,
      async (resp, ent) => {
        await resp;
        await WorkspaceService.createWorkspace({
          wsRoot: path.join(wsRoot, ent.name),
          vaults: ent.vaults,
        });
        return ws.addWorkspace({ workspace: ent });
      },
      Promise.resolve({ vaults: [] } as { vaults: DVault[] })
    );
    vaults = vaults.concat(vaultsFromWs.vaults);
  }
  if (opts.asRemote) {
    await GitTestUtils.createRepoWithReadme(wsRoot);
  }
  return { wsRoot, vaults };
}

export type RunEngineTestV5Opts = {
  preSetupHook?: SetupHookFunction;
  createEngine?: AsyncCreateEngineFunction;
  extra?: any;
  expect: any;
  workspaces?: DWorkspace[];
  setupOnly?: boolean;
  initGit?: boolean;
  initHooks?: boolean;
  addVSWorkspace?: boolean;
  /**
   * Path to preset wsRoot
   */
  wsRoot?: string;
} & TestSetupWorkspaceOpts;

export type RunEngineTestFunctionV5<T = any> = (
  opts: RunEngineTestFunctionOpts & { extra?: any; engineInitDuration: number }
) => Promise<TestResult[] | void | T>;

export class TestPresetEntryV5 {
  public preSetupHook: PreSetupHookFunction;
  public postSetupHook: PostSetupHookFunction;
  public testFunc: RunEngineTestFunctionV4;
  public extraOpts: any;
  public setupTest?: SetupTestFunctionV4;
  public genTestResults?: GenTestResults;
  public vaults: DVault[];
  public workspaces: DWorkspace[];

  constructor(
    func: RunEngineTestFunctionV5,
    opts?: {
      preSetupHook?: PreSetupHookFunction;
      postSetupHook?: PostSetupHookFunction;
      extraOpts?: any;
      setupTest?: SetupTestFunctionV4;
      genTestResults?: GenTestResults;
      vaults?: DVault[];
    }
  ) {
    let {
      preSetupHook,
      postSetupHook,
      extraOpts,
      setupTest,
      genTestResults,
      workspaces,
    } = _.defaults(opts, {
      workspaces: [],
    });
    this.preSetupHook = preSetupHook ? preSetupHook : async () => {};
    this.postSetupHook = postSetupHook ? postSetupHook : async () => {};
    this.testFunc = _.bind(func, this);
    this.extraOpts = extraOpts;
    this.setupTest = setupTest;
    this.genTestResults = _.bind(
      genTestResults ? genTestResults : async () => [],
      this
    );
    this.workspaces = workspaces;
    this.vaults = opts?.vaults || [
      { fsPath: "vault1" },
      { fsPath: "vault2" },
      {
        name: "vaultThree",
        fsPath: "vault3",
      },
    ];
  }
}

/**
 *
 * To create empty workspace, initilizae with `vaults = []`
 * @param func
 * @param opts.vaults: By default, initiate 3 vaults {vault1, vault2, (vault3, "vaultThree")}
 * @param opts.preSetupHook: By default, initiate empty
 * @param opts.wsRoot: Override the randomly generated test directory for the wsRoot
 * @returns
 */
export async function runEngineTestV5(
  func: RunEngineTestFunctionV5,
  opts: RunEngineTestV5Opts
): Promise<any> {
  const {
    preSetupHook,
    extra,
    vaults: vaultsInit,
    createEngine,
    initGit,
    workspaces,
    addVSWorkspace,
  } = _.defaults(opts, {
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
    addVSWorkspace: false,
  });
  try {
    // make sure tests don't overwrite local homedir contents
    TestEngineUtils.mockHomeDir();
    const { wsRoot, vaults } = await setupWS({
      vaults: vaultsInit,
      workspaces,
      wsRoot: opts.wsRoot,
    });
    if ((opts.initHooks, vaults)) {
      fs.ensureDirSync(path.join(wsRoot, CONSTANTS.DENDRON_HOOKS_BASE));
    }
    await preSetupHook({ wsRoot, vaults });
    const engine: DEngineClient = await createEngine({ wsRoot, vaults });
    const start = process.hrtime();
    const initResp = await engine.init();
    if (addVSWorkspace) {
      fs.writeJSONSync(
        path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME),
        {
          folders: vaults.map((ent) => ({
            path: ent.fsPath,
            name: ent.name,
          })) as WorkspaceFolderRaw[],
          settings: {},
          extensions: {},
        } as WorkspaceSettings,
        { spaces: 4 }
      );
    }
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
          return GitTestUtils.createRepoWithReadme(
            vault2Path({ vault, wsRoot })
          );
        })
      );
    }
    if (opts.setupOnly) {
      return testOpts;
    }
    const results = (await func(testOpts)) || [];
    await runJestHarnessV2(results, expect);
    return { opts: testOpts, resp: undefined, wsRoot };
  } finally {
    // restore sinon so other tests can keep running
    sinon.restore();
  }
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
  static mockHomeDir(dir?: string) {
    if (_.isUndefined(dir)) dir = tmpDir().name;
    sinon.stub(os, "homedir").returns(dir);
    return dir;
  }
  static vault1(vaults: DVault[]) {
    return _.find(vaults, { fsPath: "vault1" })!;
  }
}
