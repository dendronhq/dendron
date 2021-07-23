import { ServerUtils } from "@dendronhq/api-server";
import {
  DendronConfig,
  DEngineClient,
  isNotUndefined,
  WorkspaceFolderRaw,
  WorkspaceOpts,
  WorkspaceSettings,
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
  sinon,
} from "@dendronhq/common-test-utils";
import {
  DConfig,
  DendronEngineV2,
  HistoryService,
} from "@dendronhq/engine-server";
import {
  TestConfigUtils,
  TestSetupWorkspaceOpts,
} from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, beforeEach } from "mocha";
import path from "path";
import { ExtensionContext, Uri } from "vscode";
import {
  SetupWorkspaceCommand,
  SetupWorkspaceOpts,
} from "../commands/SetupWorkspace";
import {
  VaultAddCommand,
  VaultRemoteSource,
} from "../commands/VaultAddCommand";
import { Logger } from "../logger";
import { StateService } from "../services/stateService";
import { WorkspaceConfig } from "../settings";
import { InstallStatus, VSCodeUtils, WSUtils } from "../utils";
import { DendronWorkspace, getWS } from "../workspace";
import { BlankInitializer } from "../workspace/blankInitializer";
import { WorkspaceInitFactory } from "../workspace/workspaceInitializer";
import { _activate } from "../_extension";
import { onWSInit, TIMEOUT } from "./testUtils";
import {
  setupCodeConfiguration,
  SetupCodeConfigurationV2,
  stubWorkspace,
  stubWorkspaceFile,
  stubWorkspaceFolders,
} from "./testUtilsv2";

export const DENDRON_REMOTE =
  "https://github.com/dendronhq/dendron-site-vault.git";
export const DENDRON_REMOTE_VAULT = {
  fsPath: "dendron-site-vault",
  remote: {
    type: "git" as const,
    url: DENDRON_REMOTE,
  },
};

type OnInitHook = (opts: WorkspaceOpts & EngineOpt) => Promise<void>;

type PostSetupWorkspaceHook = (opts: WorkspaceOpts) => Promise<void>;

export type SetupLegacyWorkspaceOpts = SetupCodeConfigurationV2 & {
  ctx: ExtensionContext;
  preActivateHook?: any;
  postActivateHook?: any;
  preSetupHook?: PreSetupCmdHookFunction;
  postSetupHook?: PostSetupWorkspaceHook;
  setupWsOverride?: Partial<SetupWorkspaceOpts>;
};

export type SetupLegacyWorkspaceMultiOpts = SetupCodeConfigurationV2 & {
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
  setupWsOverride?: Partial<SetupWorkspaceOpts>;
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
  const config = readYAML(configPath) as DendronConfig;
  return config;
};

export const withConfig = (
  func: (config: DendronConfig) => DendronConfig,
  opts: { wsRoot: string }
) => {
  const config = getConfig(opts);

  const newConfig = func(config);
  writeConfig({ config: newConfig, wsRoot: opts.wsRoot });
  return newConfig;
};

export const writeConfig = (opts: {
  config: DendronConfig;
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
    preSetupHook: async () => {},
    postSetupHook: async () => {},
  });
  const wsRoot = tmpDir().name;
  fs.ensureDirSync(wsRoot);
  stubWorkspaceFile(wsRoot);
  setupCodeConfiguration(opts);

  await copts.preSetupHook({
    wsRoot,
  });

  const vaults = await new SetupWorkspaceCommand().execute({
    rootDirRaw: wsRoot,
    skipOpenWs: true,
    ...copts.setupWsOverride,
    workspaceInitializer: new BlankInitializer(),
  });
  stubWorkspaceFolders(vaults);

  await copts.postSetupHook({
    wsRoot,
    vaults,
  });
  return { wsRoot, vaults };
}

export async function setupLegacyWorkspaceMulti(
  opts: SetupLegacyWorkspaceMultiOpts
): Promise<any> {
  const copts = _.defaults(opts, {
    setupWsOverride: {
      skipConfirmation: true,
      emptyWs: true,
    },
    preSetupHook: async () => {},
    postSetupHook: async () => {},
    wsSettingsOverride: {},
  });
  const { preSetupHook, postSetupHook, wsSettingsOverride } = copts;

  const { wsRoot, vaults } = await EngineTestUtilsV4.setupWS();
  new StateService(opts.ctx); // eslint-disable-line no-new
  setupCodeConfiguration(opts);
  // setup workspace file
  stubWorkspace({ wsRoot, vaults });
  const workspaceFile = DendronWorkspace.workspaceFile();
  const workspaceFolders = DendronWorkspace.workspaceFolders();

  // setup
  WorkspaceConfig.write(wsRoot, vaults, {
    overrides: wsSettingsOverride,
    vaults,
  });
  await preSetupHook({
    wsRoot,
    vaults,
  });
  // await new SetupWorkspaceCommand().execute({
  //   rootDirRaw: wsRoot,
  //   skipOpenWs: true,
  //   ...copts.setupWsOverride,
  // });

  // update vscode settings
  await DendronWorkspace.updateWorkspaceFile({
    updateCb: (settings) => {
      const folders: WorkspaceFolderRaw[] = vaults.map((ent) => ({
        path: ent.fsPath,
      }));
      settings = assignJSONWithComment({ folders }, settings);
      return settings;
    },
  });

  // update config
  let config = DConfig.getOrCreate(wsRoot);
  if (isNotUndefined(copts.modConfigCb)) {
    config = TestConfigUtils.withConfig(copts.modConfigCb, { wsRoot });
  }
  config.vaults = vaults;
  DConfig.writeConfig({ wsRoot, config });
  await postSetupHook({
    wsRoot,
    vaults,
  });
  return { wsRoot, vaults, workspaceFile, workspaceFolders };
}

/**
 * Old style layout
 */
export async function runLegacySingleWorkspaceTest(
  opts: SetupLegacyWorkspaceOpts & { onInit: OnInitHook }
) {
  const { wsRoot, vaults } = await setupLegacyWorkspace(opts);
  onWSInit(async () => {
    const engine = getWS().getEngine();
    await opts.onInit({ wsRoot, vaults, engine });
  });
  await _activate(opts.ctx);
  return;
}

/**
 * Old style layout
 */
export async function runLegacyMultiWorkspaceTest(
  opts: SetupLegacyWorkspaceMultiOpts & { onInit: OnInitHook }
) {
  const { wsRoot, vaults } = await setupLegacyWorkspaceMulti(opts);
  onWSInit(async () => {
    const engine = getWS().getEngine();
    await opts.onInit({ wsRoot, vaults, engine });
  });
  await _activate(opts.ctx);
  return;
}

export function runSingleWorkspaceTest() {}

export function runMultiWorkspaceTest() {}

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
    beforeHook?: any;
    afterHook?: any;
    noSetInstallStatus?: boolean;
    noStubExecServerNode?: boolean;
  }
) {
  let ctx: ExtensionContext;
  // allows for
  _this.timeout(TIMEOUT);
  ctx = VSCodeUtils.getOrCreateMockContext();
  beforeEach(async () => {
    DendronWorkspace.getOrCreate(ctx);

    // workspace has not upgraded
    if (!opts?.noSetInstallStatus) {
      sinon
        .stub(VSCodeUtils, "getInstallStatusForExtension")
        .returns(InstallStatus.NO_CHANGE);
    }
    // workspace is not tutorial workspace
    sinon
      .stub(WorkspaceInitFactory, "isTutorialWorkspaceLaunch")
      .returns(false);
    if (!opts?.noStubExecServerNode) {
      sinon.stub(ServerUtils, "execServerNode").returns(
        new Promise(async (resolve) => {
          const { launchv2 } = require("@dendronhq/api-server"); // eslint-disable-line global-require
          const { port } = await launchv2({
            logPath: path.join(__dirname, "..", "..", "dendron.server.log"),
          });
          resolve({ port, subprocess: { pid: -1 } as any });
        })
      );
      sinon.stub(WSUtils, "handleServerProcess").returns();
    }
    if (opts?.beforeHook) {
      await opts.beforeHook();
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
    return getWS().getEngine().notes;
  }
  get schemas() {
    return getWS().getEngine().schemas;
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
