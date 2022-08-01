import { Server } from "@dendronhq/api-server";
import {
  CleanDendronSiteConfig,
  ConfigUtils,
  CONSTANTS,
  DEngineClient,
  DVault,
  DWorkspace,
  IntermediateDendronConfig,
  WorkspaceFolderRaw,
  WorkspaceOpts,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  tmpDir,
  vault2Path,
} from "@dendronhq/common-server";
import {
  NoteTestUtilsV4,
  RunEngineTestFunctionOpts,
  RunEngineTestFunctionV4,
  runJestHarnessV2,
  SetupHookFunction,
  TestResult,
} from "@dendronhq/common-test-utils";
import { LaunchEngineServerCommand } from "@dendronhq/dendron-cli";
import {
  createEngine as engineServerCreateEngine,
  createEngineV3,
  DConfig,
  WorkspaceConfig,
  WorkspaceService,
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
) => Promise<{ engine: DEngineClient; port?: number; server?: Server }>;

/**
 * Create an {@link DendronEngine}
 */
export async function createEngineFromEngine(opts: WorkspaceOpts) {
  return {
    engine: engineServerCreateEngine(opts) as DEngineClient,
    port: undefined,
    server: undefined,
  };
}

/**
 * Create an {@link DendronEngine}
 */
export async function createEngineV3FromEngine(opts: WorkspaceOpts) {
  return {
    engine: createEngineV3(opts) as DEngineClient,
    port: undefined,
    server: undefined,
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
  const { engine, port, server } = await createServer(opts);
  return { engine, port, server };
}

export async function createEngineByConnectingToDebugServer(
  opts: WorkspaceOpts
): Promise<any> {
  // debug port used by launch:engine-server:debug
  const port = 3005;
  const { engine, server } = await createServer({ ...opts, port });
  return { engine, port, server };
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
  const publishingConfig = ConfigUtils.getPublishingConfig(config);
  if (publishingConfig.duplicateNoteBehavior) {
    const sortedPayload = (
      publishingConfig.duplicateNoteBehavior.payload as string[]
    ).sort();
    const updatedDuplicateNoteBehavior = publishingConfig.duplicateNoteBehavior;
    updatedDuplicateNoteBehavior.payload = sortedPayload;
    ConfigUtils.setDuplicateNoteBehavior(config, updatedDuplicateNoteBehavior);
  }
  if (opts.modConfigCb) config = opts.modConfigCb(config);
  await ws.setConfig(config);
  if (opts.workspaces) {
    const vaultsFromWs = await _.reduce(
      opts.workspaces,
      async (resp, ent) => {
        await resp;
        await WorkspaceService.createWorkspace({
          wsRoot: path.join(wsRoot, ent.name),
          additionalVaults: ent.vaults,
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
  let server: Server | undefined;

  try {
    // --- begin ws setup
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

    // --- begin engine setup
    await preSetupHook({ wsRoot, vaults });
    const resp = await createEngine({ wsRoot, vaults });
    const engine = resp.engine;
    server = resp.server;
    const start = process.hrtime();
    const initResp = await engine.init();
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
    if (server) {
      server.close();
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
}
