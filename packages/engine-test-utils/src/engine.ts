import {
  CleanDendronSiteConfig,
  CONSTANTS,
  IntermediateDendronConfig,
  DEngineClient,
  DVault,
  DWorkspace,
  WorkspaceFolderRaw,
  WorkspaceOpts,
  WorkspaceSettings,
  ConfigUtils,
  NoteUtils,
  NoteChangeEntry,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  tmpDir,
  vault2Path,
} from "@dendronhq/common-server";
import {
  GenTestResults,
  NoteTestUtilsV4,
  PostSetupHookFunction,
  PreSetupHookFunction,
  RunEngineTestFunctionOpts,
  RunEngineTestFunctionV4,
  runJestHarnessV2,
  SetupHookFunction,
  SetupTestFunctionV4,
  TestResult,
} from "@dendronhq/common-test-utils";
import { LaunchEngineServerCommand } from "@dendronhq/dendron-cli";
import {
  createEngine as engineServerCreateEngine,
  DConfig,
  WorkspaceService,
  WorkspaceConfig,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import os from "os";
import path from "path";
import sinon, { SinonStub } from "sinon";
import { ENGINE_HOOKS } from "./presets";
import { GitTestUtils } from "./utils";

export type ModConfigCb = (
  config: IntermediateDendronConfig
) => IntermediateDendronConfig;

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
  modConfigCb?: ModConfigCb;
  git?: {
    initVaultWithRemote?: boolean;
    branchName?: string;
  };
};

export type AsyncCreateEngineFunction = (
  opts: WorkspaceOpts
) => Promise<{ engine: DEngineClient; port?: number }>;

/**
 * Create an {@link DendronEngine}
 */
export async function createEngineFromEngine(opts: WorkspaceOpts) {
  return {
    engine: engineServerCreateEngine(opts) as DEngineClient,
    port: undefined,
  };
}

export { DEngineClient, DVault, WorkspaceOpts };

/**
 * Create a server
 * @param opts
 * @returns
 */
export async function createServer(opts: WorkspaceOpts & { port?: number }) {
  return (
    await new LaunchEngineServerCommand().enrichArgs({
      wsRoot: opts.wsRoot,
      port: opts.port,
    })
  ).data;
}

/**
 * Create an {@link DendronEngineClient}
 */
export async function createEngineFromServer(
  opts: WorkspaceOpts
): Promise<any> {
  const { engine, port } = await createServer(opts);
  await engine.init();
  return { engine, port };
}

export async function createEngineByConnectingToDebugServer(
  opts: WorkspaceOpts
): Promise<any> {
  // debug port used by launch:engine-server:debug
  const port = 3005;
  const { engine } = await createServer({ ...opts, port });
  await engine.init();
  return { engine, port };
}

export function createSiteConfig(
  opts: Partial<CleanDendronSiteConfig> &
    Required<Pick<CleanDendronSiteConfig, "siteRootDir" | "siteHierarchies">>
): CleanDendronSiteConfig {
  const copts = {
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
  modConfigCb?: ModConfigCb;
}) {
  const wsRoot = opts.wsRoot || tmpDir().name;
  const ws = new WorkspaceService({ wsRoot });
  ws.createConfig();
  // create dendron.code-workspace
  WorkspaceConfig.write(wsRoot, opts.vaults);

  let config = ws.config;
  let vaults = await Promise.all(
    opts.vaults.map(async (vault) => {
      await ws.createVault({ vault, config, updateConfig: false });
      return vault;
    })
  );
  const vaultsConfig = ConfigUtils.getVaults(config);
  const sortedVaultsConfig = _.sortBy(vaultsConfig, "fsPath");
  ConfigUtils.setVaults(config, sortedVaultsConfig);
  if (config.site.duplicateNoteBehavior) {
    config.site.duplicateNoteBehavior.payload = (
      config.site.duplicateNoteBehavior.payload as string[]
    ).sort();
  }
  if (opts.modConfigCb) config = opts.modConfigCb(config);
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
  opts: RunEngineTestFunctionOpts & {
    extra?: any;
    engineInitDuration: number;
    port?: number;
  }
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
    const {
      preSetupHook,
      postSetupHook,
      extraOpts,
      setupTest,
      genTestResults,
      workspaces,
    } = _.defaults(opts, {
      workspaces: [],
    });
    this.preSetupHook = preSetupHook || (async () => {});
    this.postSetupHook = postSetupHook || (async () => {});
    this.testFunc = _.bind(func, this);
    this.extraOpts = extraOpts;
    this.setupTest = setupTest;
    this.genTestResults = _.bind(genTestResults || (async () => []), this);
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
 * See [[Run Engine Test|dendron://dendron.docs/pkg.engine-test-utils.ref.run-engine-test]]
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
    git,
  } = _.defaults(opts, {
    preSetupHook: async () => {},
    postSetupHook: async () => {},
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

  let homeDirStub: sinon.SinonStub | undefined;

  try {
    // make sure tests don't overwrite local homedir contents
    homeDirStub = TestEngineUtils.mockHomeDir();
    const { wsRoot, vaults } = await setupWS({
      vaults: vaultsInit,
      workspaces,
      wsRoot: opts.wsRoot,
      modConfigCb: opts.modConfigCb,
    });
    if ((opts.initHooks, vaults)) {
      fs.ensureDirSync(path.join(wsRoot, CONSTANTS.DENDRON_HOOKS_BASE));
    }
    await preSetupHook({ wsRoot, vaults });
    const resp = await createEngine({ wsRoot, vaults });
    const engine = resp.engine;
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
      port: resp.port,
      extra,
      config: engine,
      engineInitDuration,
    };
    if (initGit) {
      await GitTestUtils.createRepoForWorkspace(wsRoot);
      await Promise.all(
        vaults.map((vault) => {
          return GitTestUtils.createRepoWithReadme(
            vault2Path({ vault, wsRoot }),
            { remote: git?.initVaultWithRemote, branchName: git?.branchName }
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
    if (homeDirStub) {
      homeDirStub.restore();
    }
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
  static mockHomeDir(dir?: string): SinonStub {
    if (_.isUndefined(dir)) dir = tmpDir().name;
    return sinon.stub(os, "homedir").returns(dir);
  }

  static vault1(vaults: DVault[]) {
    return _.find(vaults, { fsPath: "vault1" })!;
  }

  static vault2(vaults: DVault[]) {
    return _.find(vaults, { fsPath: "vault2" })!;
  }

  static vault3(vaults: DVault[]) {
    return _.find(vaults, { fsPath: "vault3" })!;
  }

  /**
   * Sugar for creating a note in the first vault
   */
  static createNoteByFname({
    fname,
    body = "",
    custom,
    vaults,
    wsRoot,
  }: {
    fname: string;
    body: string;
    custom?: any;
  } & WorkspaceOpts) {
    const vault = vaults[0];
    return NoteTestUtilsV4.createNote({ wsRoot, vault, fname, body, custom });
  }

  /**
   * Sugar for retrieving a note in the first vault
   */
  static getNoteByFname(engine: DEngineClient, fname: string) {
    const { wsRoot, vaults, notes } = engine;
    const vault = vaults[0];
    return NoteUtils.getNoteByFnameV5({ fname, notes, vault, wsRoot });
  }
}

/**
 * Test helper function to get a subset of NoteChangeEntry's matching a
 * particular status from an array
 * @param entries
 * @param status
 * @returns
 */
export function extractNoteChangeEntriesByType(
  entries: NoteChangeEntry[],
  status: "create" | "delete" | "update"
): NoteChangeEntry[] {
  return entries.filter((entry) => entry.status === status);
}
