import {
  ConfigUtils,
  DENDRON_VSCODE_CONFIG_KEYS,
  DEngineClient,
  Disposable,
  DVault,
  InstallStatus,
  IntermediateDendronConfig,
  isNotUndefined,
  NoteChangeEntry,
  NoteUtils,
  SchemaUtils,
  VaultRemoteSource,
  WorkspaceFolderRaw,
  WorkspaceOpts,
  WorkspaceSettings,
  WorkspaceType,
} from "@dendronhq/common-all";
import {
  assignJSONWithComment,
  DConfig,
  note2File,
  readYAML,
  schemaModuleOpts2File,
  tmpDir,
  writeYAML,
} from "@dendronhq/common-server";
import {
  CreateEngineFunction,
  EngineOpt,
  EngineTestUtilsV4,
  PreSetupCmdHookFunction,
  PreSetupHookFunction,
} from "@dendronhq/common-test-utils";
import {
  DendronEngineClient,
  DendronEngineV2,
  Git,
  HistoryService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import {
  ModConfigCb,
  TestConfigUtils,
  TestSetupWorkspaceOpts,
} from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { after, afterEach, before, beforeEach, describe } from "mocha";
import os from "os";
import sinon from "sinon";
import {
  CancellationToken,
  ExtensionContext,
  Uri,
  WorkspaceFolder,
} from "vscode";
import {
  SetupWorkspaceCommand,
  SetupWorkspaceOpts,
} from "../commands/SetupWorkspace";
import { VaultAddCommand } from "../commands/VaultAddCommand";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { StateService } from "../services/stateService";
import { WorkspaceConfig } from "../settings";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import { BlankInitializer } from "../workspace/blankInitializer";
import { WorkspaceInitFactory } from "../workspace/WorkspaceInitFactory";
import { _activate } from "../_extension";
import {
  cleanupVSCodeContextSubscriptions,
  setupCodeConfiguration,
  SetupCodeConfigurationV2,
  stubWorkspace,
  stubWorkspaceFile,
  stubWorkspaceFolders,
} from "./testUtilsv2";

const TIMEOUT = 60 * 1000 * 5;

export const DENDRON_REMOTE =
  "https://github.com/dendronhq/dendron-site-vault.git";
export const DENDRON_REMOTE_VAULT = {
  fsPath: "dendron-site-vault",
  remote: {
    type: "git" as const,
    url: DENDRON_REMOTE,
  },
};

export type OnInitHook = (opts: WorkspaceOpts & EngineOpt) => Promise<void>;

type PostSetupWorkspaceHook = (opts: WorkspaceOpts) => Promise<void>;

type SetupWorkspaceType = {
  /** The type of workspace to create for the test, Native (w/o dendron.code-worksace) or Code (w/ dendron.code-workspace) */
  workspaceType?: WorkspaceType;
  /** If true, create a self contained vault as the workspace.
   *
   * Setting this option will also override the VSCode setting `dendron.enableSelfContainedVaultWorkspace`.
   *
   * TODO: This option is temporary until self contained vaults become the default, at which point this should be removed and all tests should default to self contained.
   */
  selfContained?: boolean;
};

export type SetupLegacyWorkspaceOpts = SetupCodeConfigurationV2 &
  SetupWorkspaceType & {
    ctx?: ExtensionContext;
    preSetupHook?: PreSetupCmdHookFunction;
    postSetupHook?: PostSetupWorkspaceHook;
    setupWsOverride?: Omit<Partial<SetupWorkspaceOpts>, "workspaceType">;
    modConfigCb?: ModConfigCb;
    noSetInstallStatus?: boolean; // by default, we set install status to NO_CHANGE. use this when you need to test this logic
  };

export type SetupLegacyWorkspaceMultiOpts = SetupCodeConfigurationV2 &
  SetupWorkspaceType & {
    ctx?: ExtensionContext;
    /**
     * Runs before the workspace is initialized
     */
    preSetupHook?: PreSetupHookFunction;
    /**
     * Runs after the workspace is initialized
     */
    postSetupHook?: PostSetupWorkspaceHook;
    /**
     * By default, create workspace and vaults in a random temporary dir.
     */
    setupWsOverride?: Omit<Partial<SetupWorkspaceOpts>, "workspaceType">;
    /**
     * Overrid default Dendron settings (https://dendron.so/notes/eea2b078-1acc-4071-a14e-18299fc28f48.html)
     */
    wsSettingsOverride?: Partial<WorkspaceSettings>;
  } & TestSetupWorkspaceOpts;

export class EditorUtils {
  static async getURIForActiveEditor(): Promise<Uri> {
    return VSCodeUtils.getActiveTextEditor()!.document.uri;
  }
}

export const getConfig = (opts: { wsRoot: string }) => {
  const configPath = DConfig.configPath(opts.wsRoot);
  const config = readYAML(configPath) as IntermediateDendronConfig;
  return config;
};

export const withConfig = (
  func: (config: IntermediateDendronConfig) => IntermediateDendronConfig,
  opts: { wsRoot: string }
) => {
  const config = getConfig(opts);

  const newConfig = func(config);
  writeConfig({ config: newConfig, wsRoot: opts.wsRoot });
  return newConfig;
};

export const writeConfig = (opts: {
  config: IntermediateDendronConfig;
  wsRoot: string;
}) => {
  const configPath = DConfig.configPath(opts.wsRoot);
  return writeYAML(configPath, opts.config);
};

export async function setupWorkspace() {} // eslint-disable-line no-empty-function

export async function setupLegacyWorkspace(
  opts: SetupLegacyWorkspaceOpts
): Promise<WorkspaceOpts> {
  const copts = _.defaults(opts, {
    setupWsOverride: {
      skipConfirmation: true,
      emptyWs: true,
    },
    workspaceType: WorkspaceType.CODE,
    preSetupHook: async () => {},
    postSetupHook: async () => {},
    selfContained: true,
  });
  const wsRoot = tmpDir().name;
  if (opts.selfContained) {
    // If self contained, also override the self contained vaults VSCode config.
    // This will make SetupWorkspaceCommand create self contained vaults.
    if (!opts.configOverride) opts.configOverride = {};
    opts.configOverride[
      DENDRON_VSCODE_CONFIG_KEYS.ENABLE_SELF_CONTAINED_VAULTS_WORKSPACE
    ] = true;
  }
  await fs.ensureDir(wsRoot);
  if (copts.workspaceType === WorkspaceType.CODE) stubWorkspaceFile(wsRoot);
  setupCodeConfiguration(opts);

  await copts.preSetupHook({
    wsRoot,
  });

  const { wsVault, additionalVaults } =
    await new SetupWorkspaceCommand().execute({
      rootDirRaw: wsRoot,
      skipOpenWs: true,
      ...copts.setupWsOverride,
      workspaceInitializer: new BlankInitializer(),
      workspaceType: copts.workspaceType,
      selfContained: copts.selfContained,
    });
  const vaults = [wsVault, ...(additionalVaults || [])].filter(
    (v) => !_.isUndefined(v)
  ) as DVault[];
  stubWorkspaceFolders(wsRoot, vaults);

  // update config
  let config = DConfig.getOrCreate(wsRoot);
  if (isNotUndefined(copts.modConfigCb)) {
    config = TestConfigUtils.withConfig(copts.modConfigCb, { wsRoot });
  }
  await DConfig.writeConfig({ wsRoot, config });

  await copts.postSetupHook({
    wsRoot,
    vaults,
  });
  return { wsRoot, vaults };
}

//  ^bq7n7azzkpj2
export async function setupLegacyWorkspaceMulti(
  opts: SetupLegacyWorkspaceMultiOpts
) {
  const copts = _.defaults(opts, {
    setupWsOverride: {
      skipConfirmation: true,
      emptyWs: true,
    },
    workspaceType: WorkspaceType.CODE,
    preSetupHook: async () => {},
    postSetupHook: async () => {},
    wsSettingsOverride: {},
  });
  const { preSetupHook, postSetupHook, wsSettingsOverride } = copts;

  if (!opts.configOverride) opts.configOverride = {};
  // Always override the self contained config, otherwise it picks up the
  // setting in the developer's machine during testing.
  opts.configOverride[
    DENDRON_VSCODE_CONFIG_KEYS.ENABLE_SELF_CONTAINED_VAULTS_WORKSPACE
  ] = !!opts.selfContained;

  let workspaceFile: Uri | undefined;
  // check where the keyboard shortcut is configured
  let workspaceFolders: readonly WorkspaceFolder[] | undefined;

  const { wsRoot, vaults } = await EngineTestUtilsV4.setupWS();
  new StateService(opts.ctx!); // eslint-disable-line no-new
  setupCodeConfiguration(opts);
  if (copts.workspaceType === WorkspaceType.CODE) {
    stubWorkspace({ wsRoot, vaults });

    workspaceFile = DendronExtension.workspaceFile();
    workspaceFolders = DendronExtension.workspaceFolders();

    WorkspaceConfig.write(wsRoot, vaults, {
      overrides: wsSettingsOverride,
      vaults,
    });
  } else {
    stubWorkspaceFolders(wsRoot, vaults);
  }

  await preSetupHook({
    wsRoot,
    vaults,
  });
  // update vscode settings
  if (copts.workspaceType === WorkspaceType.CODE) {
    await WorkspaceUtils.updateCodeWorkspaceSettings({
      wsRoot,
      updateCb: (settings) => {
        const folders: WorkspaceFolderRaw[] = vaults.map((ent) => ({
          path: ent.fsPath,
        }));
        settings = assignJSONWithComment({ folders }, settings);
        return settings;
      },
    });
  }

  // update config
  let config = DConfig.getOrCreate(wsRoot);
  if (isNotUndefined(copts.modConfigCb)) {
    config = TestConfigUtils.withConfig(copts.modConfigCb, { wsRoot });
  }
  ConfigUtils.setVaults(config, vaults);
  await DConfig.writeConfig({ wsRoot, config });
  await postSetupHook({
    wsRoot,
    vaults,
  });
  return { wsRoot, vaults, workspaceFile, workspaceFolders };
}

/**
 * @deprecated please use {@link describeSingleWS} instead
 */
export async function runLegacySingleWorkspaceTest(
  opts: SetupLegacyWorkspaceOpts & { onInit: OnInitHook }
) {
  const { wsRoot, vaults } = await setupLegacyWorkspace(opts);
  await _activate(opts.ctx!, {
    skipLanguageFeatures: true,
    skipInteractiveElements: true,
    skipMigrations: true,
    skipTreeView: true,
  });
  const engine = ExtensionProvider.getEngine();
  await opts.onInit({ wsRoot, vaults, engine });

  cleanupVSCodeContextSubscriptions(opts.ctx!);
}

/**
 * @deprecated please use {@link describeMultiWS} instead
 */
export async function runLegacyMultiWorkspaceTest(
  opts: SetupLegacyWorkspaceMultiOpts & {
    onInit: OnInitHook;
    skipMigrations?: boolean;
  }
) {
  const { wsRoot, vaults } = await setupLegacyWorkspaceMulti(opts);
  await _activate(opts.ctx!, {
    skipLanguageFeatures: true,
    skipInteractiveElements: true,
    skipMigrations: _.isBoolean(opts.skipMigrations)
      ? opts.skipMigrations
      : true,
    skipTreeView: true,
  });
  const engine = ExtensionProvider.getEngine();
  await opts.onInit({ wsRoot, vaults, engine });

  cleanupVSCodeContextSubscriptions(opts.ctx!);
}

export function addDebugServerOverride() {
  return {
    configOverride: {
      "dendron.serverPort": "3005",
    },
  };
}

/**
 * @deprecated. If using {@link describeSingleWS} or {@link describeMultiWS}, this call is no longer necessary
 *
 * If you need before or after hooks, you can use `before()` and `after()` to set them up.
 * Timeout and `noSetInstallStatus` can be set on the options for the test harnesses.
 *
 * @param _this
 * @param opts.noSetInstallStatus: by default, we set install status to NO_CHANGE. use this when you need to test this logic
 */
export function setupBeforeAfter(
  _this: any,
  opts?: {
    beforeHook?: (ctx: ExtensionContext) => any;
    afterHook?: any;
    noSetInstallStatus?: boolean;
    noSetTimeout?: boolean;
  }
) {
  // allows for
  if (!opts?.noSetTimeout) {
    _this.timeout(TIMEOUT);
  }
  const ctx = VSCodeUtils.getOrCreateMockContext();
  beforeEach(async () => {
    // DendronWorkspace.getOrCreate(ctx);

    // workspace has not upgraded
    if (!opts?.noSetInstallStatus) {
      // try to remove any existing stub in case it exists
      // this is because we have tests that call `setupBeforeAfter` as well as
      // in describeMultiWS > [[../packages/plugin-core/src/test/testUtilsV3.ts#^lk3whwd4kh4k]]
      // TODO: keep in place until we completely remove `setupBeforeAndAfter`
      try {
        // @ts-ignore
        sinon
          .stub(VSCodeUtils, "getInstallStatusForExtension")
          .returns(InstallStatus.NO_CHANGE);
      } catch (e) {
        // eat it.
        sinon.restore();
        sinon
          .stub(VSCodeUtils, "getInstallStatusForExtension")
          .returns(InstallStatus.NO_CHANGE);
      }
    }

    sinon.stub(WorkspaceInitFactory, "create").returns(new BlankInitializer());

    if (opts?.beforeHook) {
      await opts.beforeHook(ctx);
    }
    Logger.configure(ctx, "info");
  });
  afterEach(async () => {
    HistoryService.instance().clearSubscriptions();
    if (opts?.afterHook) {
      await opts.afterHook();
    }
    sinon.restore();
  });
  return ctx;
}

export function stubSetupWorkspace({ wsRoot }: { wsRoot: string }) {
  // @ts-ignore
  VSCodeUtils.gatherFolderPath = () => {
    return wsRoot;
  };
}

class FakeEngine {}

type EngineOverride = {
  [P in keyof DendronEngineV2]: (opts: WorkspaceOpts) => DendronEngineV2[P];
};

export const createEngineFactory = (
  overrides?: Partial<EngineOverride>
): CreateEngineFunction => {
  const createEngine: CreateEngineFunction = (
    opts: WorkspaceOpts
  ): DEngineClient => {
    const engine = new FakeEngine() as DEngineClient;
    _.map(overrides || {}, (method, key: keyof DendronEngineV2) => {
      // @ts-ignore
      engine[key] = method(opts);
    });
    return engine;
  };
  return createEngine;
};

export const stubVaultInput = (opts: {
  cmd?: VaultAddCommand;
  sourceType: VaultRemoteSource;
  sourcePath: string;
  sourcePathRemote?: string;
  sourceName?: string;
}): void => {
  if (opts.cmd) {
    sinon.stub(opts.cmd, "gatherInputs").returns(
      Promise.resolve({
        type: opts.sourceType,
        name: opts.sourceName,
        path: opts.sourcePath,
        pathRemote: opts.sourcePathRemote,
      })
    );
  }

  let acc = 0;
  // @ts-ignore
  VSCodeUtils.showQuickPick = async () => ({ label: opts.sourceType });

  VSCodeUtils.showInputBox = async () => {
    if (acc === 0) {
      acc += 1;
      return opts.sourcePath;
    } else if (acc === 1) {
      acc += 1;
      return opts.sourceName;
    } else {
      throw Error("exceed acc limit");
    }
  };
  return;
};

export function runTestButSkipForWindows() {
  const runTest = os.platform() === "win32" ? describe.skip : describe;
  return runTest;
}

export function runSuiteButSkipForWindows() {
  const runTest = os.platform() === "win32" ? suite.skip : suite;
  return runTest;
}

/**
 * Use to run tests with a multi-vault workspace. Used in the same way as
 * regular `describe`. For example:
 * ```ts
 * describeMultiWS(
 *   "WHEN workspace type is not specified",
 *   {
 *     preSetupHook: ENGINE_HOOKS.setupBasic,
 *   },
 *   () => {
 *     test("THEN initializes correctly", (done) => {
 *       const { engine, _wsRoot, _vaults } = getDWorkspace();
 *       const testNote = await engine.getNote("foo").data!;
 *       expect(testNote).toBeTruthy();
 *       done();
 *     });
 *   }
 * );
 * ```
 * @param title
 * @param opts
 * @param fn - the test() functions to execute. NOTE: This function CANNOT be
 * async, or else the test may not fail reliably when your expect or assert
 * conditions are not met. ^eq30h1lt0zat
 */
export function describeMultiWS(
  title: string,
  opts: SetupLegacyWorkspaceMultiOpts & {
    /**
     * Run after we stub vscode mock workspace, but before the workspace is created
     */
    beforeHook?: (opts: { ctx: ExtensionContext }) => Promise<void>;
    /**
     * Run after the workspace is crated, but before dendron is activated
     */
    preActivateHook?: (opts: {
      ctx: ExtensionContext;
      wsRoot: string;
      vaults: DVault[];
    }) => Promise<void>;
    /**
     * @deprecated Please use an `after()` hook instead
     */
    afterHook?: (opts: { ctx: ExtensionContext }) => Promise<void>;
    /**
     * Custom timeout for test in milleseconds
     * You will need to set this when stepping through mocha tests using breakpoints
     * otherwise the test will timeout during debugging
     * See [[Breakpoints|dendron://dendron.docs/pkg.plugin-core.qa.debug#breakpoints]] for more details
     */
    timeout?: number;
    noSetInstallStatus?: boolean;
    skipMigrations?: boolean;
  },
  fn: (ctx: ExtensionContext) => void
) {
  describe(title, function () {
    if (opts.timeout) {
      this.timeout(opts.timeout);
    }
    const ctx = opts.ctx ?? VSCodeUtils.getOrCreateMockContext();

    before(async () => {
      setupWorkspaceStubs({ ...opts, ctx });
      if (opts.beforeHook) {
        await opts.beforeHook({ ctx });
      }

      const out = await setupLegacyWorkspaceMulti({ ...opts, ctx });

      if (opts.preActivateHook) {
        await opts.preActivateHook({ ctx, ...out });
      }
      await _activate(ctx, {
        skipLanguageFeatures: true,
        skipInteractiveElements: true,
        skipMigrations: _.isBoolean(opts.skipMigrations)
          ? opts.skipMigrations
          : true,
        skipTreeView: true,
      });
    });

    const result = fn(ctx);
    assertTestFnNotAsync(result);

    // Release all registered resouces such as commands and providers
    after(async () => {
      if (opts.afterHook) {
        await opts.afterHook({ ctx });
      }
      cleanupWorkspaceStubs(ctx);
    });
  });
}
describeMultiWS.only = function (
  ...params: Parameters<typeof describeMultiWS>
) {
  describe.only("", () => {
    describeMultiWS(...params);
  });
};
describeMultiWS.skip = function (
  ...params: Parameters<typeof describeMultiWS>
) {
  describe.skip("", () => {
    describeMultiWS(...params);
  });
};

/**
 * Use to run tests with a single-vault workspace. Used in the same way as
 * regular `describe`.
 * @param title
 * @param opts
 * @param fn - the test() functions to execute. NOTE: This function CANNOT be
 * async, or else the test may not fail reliably when your expect or assert
 * conditions are not met.
 */
export function describeSingleWS(
  title: string,
  opts: SetupLegacyWorkspaceOpts & {
    /**
     * Custom timeout for test in milleseconds
     * You will need to set this when stepping through mocha tests using breakpoints
     * otherwise the test will timeout during debugging
     * See [[Breakpoints|dendron://dendron.docs/pkg.plugin-core.qa.debug#breakpoints]] for more details
     */
    timeout?: number;
  },
  fn: (ctx: ExtensionContext) => void
) {
  describe(title, function () {
    if (opts.timeout) {
      this.timeout(opts.timeout);
    }
    const ctx = opts.ctx ?? VSCodeUtils.getOrCreateMockContext();
    before(async () => {
      setupWorkspaceStubs({ ...opts, ctx });
      await setupLegacyWorkspace(opts);
      await _activate(ctx, {
        skipLanguageFeatures: true,
        skipInteractiveElements: true,
        skipMigrations: true,
        skipTreeView: true,
      });
    });

    const result = fn(ctx);
    assertTestFnNotAsync(result);

    // Release all registered resouces such as commands and providers
    after(() => {
      cleanupWorkspaceStubs(ctx);
    });
  });
}
describeSingleWS.only = function (
  ...params: Parameters<typeof describeSingleWS>
) {
  describe.only("", () => {
    describeSingleWS(...params);
  });
};
describeSingleWS.skip = function (
  ...params: Parameters<typeof describeSingleWS>
) {
  describe.skip("", () => {
    describeSingleWS(...params);
  });
};

/**
 * Helper function for Describe*WS to do a run-time check to make sure an async
 * test function hasn't been passed
 * @param testFnResult
 */
function assertTestFnNotAsync(testFnResult: any) {
  if (
    testFnResult &&
    testFnResult.then &&
    typeof testFnResult.then === "function"
  ) {
    throw new Error(
      "test fn passed to DescribeWS cannot be async! Please re-write the test"
    );
  }
}

export function stubCancellationToken(): CancellationToken {
  return {
    isCancellationRequested: false,
    onCancellationRequested: () => {
      return {
        dispose: () => {},
      };
    },
  };
}

export function setupWorkspaceStubs(opts: {
  ctx: ExtensionContext;
  noSetInstallStatus?: boolean;
}): ExtensionContext {
  // workspace has not upgraded
  if (!opts.noSetInstallStatus) {
    sinon
      .stub(VSCodeUtils, "getInstallStatusForExtension")
      .returns(InstallStatus.NO_CHANGE);
  }
  sinon.stub(WorkspaceInitFactory, "create").returns(new BlankInitializer());
  Logger.configure(opts.ctx, "info");
  return opts.ctx;
}

export function cleanupWorkspaceStubs(ctx: ExtensionContext): void {
  HistoryService.instance().clearSubscriptions();
  cleanupVSCodeContextSubscriptions(ctx);
  const ext = ExtensionProvider.getExtension();
  ext.deactivate();
  sinon.restore();
}

/**
 * Use this to test engine state changes through engine events. This can be used in
 * situations where the engine state changes asynchorously from test logic (such as from vscode event callbacks)
 *
 * @param callback to handle engine state events
 * @returns Disposable
 */
export function subscribeToEngineStateChange(
  callback: (noteChangeEntries: NoteChangeEntry[]) => void
): Disposable {
  const engineClient = toDendronEngineClient(ExtensionProvider.getEngine());
  return engineClient.onEngineNoteStateChanged(callback);
}

export function toDendronEngineClient(engine: DEngineClient) {
  return engine as DendronEngineClient;
}

async function gitInitializeRepo(dir: string) {
  const git = new Git({ localUrl: dir });
  await git.init();
  await git.add(".");
  await git.commit({ msg: "testUtilsV3" });
}

export async function createWorkspaceWithGit(
  dir: string,
  opts?: Partial<SetupWorkspaceOpts>
) {
  await fs.ensureDir(dir);
  const setup = new SetupWorkspaceCommand();
  await setup.execute({
    rootDirRaw: dir,
    skipOpenWs: true,
    selfContained: false,
    workspaceInitializer: new BlankInitializer(),
    ...opts,
  });
  await gitInitializeRepo(dir);
}

export async function createSelfContainedVaultWithGit(dir: string) {
  return createWorkspaceWithGit(dir, { selfContained: true });
}

export async function createVaultWithGit(dir: string) {
  await fs.ensureDir(dir);
  const vault: DVault = {
    fsPath: ".",
  };

  const note = NoteUtils.createRoot({
    vault,
    body: "root note",
  });
  const schema = SchemaUtils.createRootModule({ vault });
  await note2File({ note, vault, wsRoot: dir });
  await schemaModuleOpts2File(schema, dir, "root");
  await gitInitializeRepo(dir);
}

export async function waitInMilliseconds(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}
