import {
  ConfigUtils,
  DEngineClient,
  InstallStatus,
  IntermediateDendronConfig,
  isNotUndefined,
  VaultRemoteSource,
  WorkspaceFolderRaw,
  WorkspaceOpts,
  WorkspaceSettings,
  WorkspaceType,
} from "@dendronhq/common-all";
import {
  assignJSONWithComment,
  readYAML,
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
  DConfig,
  DendronEngineV2,
  HistoryService,
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
import { Logger } from "../logger";
import { StateService } from "../services/stateService";
import { WorkspaceConfig } from "../settings";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension, getDWorkspace } from "../workspace";
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
};

export type SetupLegacyWorkspaceOpts = SetupCodeConfigurationV2 &
  SetupWorkspaceType & {
    ctx: ExtensionContext;
    preActivateHook?: any;
    postActivateHook?: any;
    preSetupHook?: PreSetupCmdHookFunction;
    postSetupHook?: PostSetupWorkspaceHook;
    setupWsOverride?: Omit<Partial<SetupWorkspaceOpts>, "workspaceType">;
    modConfigCb?: ModConfigCb;
  };

export type SetupLegacyWorkspaceMultiOpts = SetupCodeConfigurationV2 &
  SetupWorkspaceType & {
    ctx: ExtensionContext;
    /**
     * Runs before the workspace is initialized
     */
    preSetupHook?: PreSetupHookFunction;
    /**
     * Runs after the workspace is initialized
     */
    postSetupHook?: PostSetupWorkspaceHook;
    /**
     * Runs before the workspace is activated
     */
    preActivateHook?: any;
    /**
     * Run after workspace is activated
     */
    postActivateHook?: any;
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
  });
  const wsRoot = tmpDir().name;
  fs.ensureDirSync(wsRoot);
  if (copts.workspaceType === WorkspaceType.CODE) stubWorkspaceFile(wsRoot);
  setupCodeConfiguration(opts);

  await copts.preSetupHook({
    wsRoot,
  });

  const vaults = await new SetupWorkspaceCommand().execute({
    rootDirRaw: wsRoot,
    skipOpenWs: true,
    ...copts.setupWsOverride,
    workspaceInitializer: new BlankInitializer(),
    workspaceType: copts.workspaceType,
  });
  stubWorkspaceFolders(wsRoot, vaults);

  // update config
  let config = DConfig.getOrCreate(wsRoot);
  if (isNotUndefined(copts.modConfigCb)) {
    config = TestConfigUtils.withConfig(copts.modConfigCb, { wsRoot });
  }
  DConfig.writeConfig({ wsRoot, config });

  await copts.postSetupHook({
    wsRoot,
    vaults,
  });
  return { wsRoot, vaults };
}

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

  let workspaceFile: Uri | undefined;
  let workspaceFolders: readonly WorkspaceFolder[] | undefined;

  const { wsRoot, vaults } = await EngineTestUtilsV4.setupWS();
  new StateService(opts.ctx); // eslint-disable-line no-new
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
    await DendronExtension.updateWorkspaceFile({
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
  DConfig.writeConfig({ wsRoot, config });
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
  await _activate(opts.ctx);
  const engine = getDWorkspace().engine;
  await opts.onInit({ wsRoot, vaults, engine });

  cleanupVSCodeContextSubscriptions(opts.ctx);
}

/**
 * @deprecated please use {@link describeMultiWS} instead
 */
export async function runLegacyMultiWorkspaceTest(
  opts: SetupLegacyWorkspaceMultiOpts & { onInit: OnInitHook }
) {
  const { wsRoot, vaults } = await setupLegacyWorkspaceMulti(opts);
  await _activate(opts.ctx);
  const engine = getDWorkspace().engine;
  await opts.onInit({ wsRoot, vaults, engine });

  cleanupVSCodeContextSubscriptions(opts.ctx);
}

export function addDebugServerOverride() {
  return {
    configOverride: {
      "dendron.serverPort": "3005",
    },
  };
}

/**
 *
 * @param _this
 * @param opts.noSetInstallStatus: by default, we set install status to NO_CHANGE. use this when you need to test this logic
 * @param opts.noStubExecServerNode: stub this to be synchronous engine laungh for tests due to latency
 * @returns
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
      sinon
        .stub(VSCodeUtils, "getInstallStatusForExtension")
        .returns(InstallStatus.NO_CHANGE);
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

class FakeEngine {
  get notes() {
    return getDWorkspace().engine.notes;
  }
  get schemas() {
    return getDWorkspace().engine.schemas;
  }
}

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
 *       const testNote = engine.notes["foo"];
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
 * conditions are not met.
 */
export function describeMultiWS(
  title: string,
  opts: SetupLegacyWorkspaceMultiOpts,
  fn: () => void
) {
  describe(title, () => {
    before(async () => {
      await setupLegacyWorkspaceMulti(opts);
      await _activate(opts.ctx);
    });

    fn();

    // Release all registered resouces such as commands and providers
    after(() => {
      cleanupVSCodeContextSubscriptions(opts.ctx);
    });
  });
}

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
  opts: SetupLegacyWorkspaceOpts,
  fn: () => void
) {
  describe(title, () => {
    before(async () => {
      await setupLegacyWorkspace(opts);
      await _activate(opts.ctx);
    });

    fn();

    // Release all registered resouces such as commands and providers
    after(() => {
      cleanupVSCodeContextSubscriptions(opts.ctx);
    });
  });
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
