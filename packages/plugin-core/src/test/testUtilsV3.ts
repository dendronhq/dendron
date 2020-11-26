import { DEngineClientV2, WorkspaceOpts } from "@dendronhq/common-all";
import { assignJSONWithComment, tmpDir } from "@dendronhq/common-server";
import {
  CreateEngineFunction,
  EngineOpt,
  EngineTestUtilsV4,
  PreSetupCmdHookFunction,
  PreSetupHookFunction,
} from "@dendronhq/common-test-utils";
import { DConfig, DendronEngineV2 } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, beforeEach } from "mocha";
import { ExtensionContext } from "vscode";
import {
  InitializeType,
  SetupWorkspaceCommand,
  SetupWorkspaceOpts,
} from "../commands/SetupWorkspace";
import { HistoryService } from "../services/HistoryService";
import { WorkspaceConfig } from "../settings";
import { WorkspaceFolderRaw, WorkspaceSettings } from "../types";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace, getWS } from "../workspace";
import { _activate } from "../_extension";
import { onWSInit, TIMEOUT } from "./testUtils";
import {
  setupCodeConfiguration,
  SetupCodeConfigurationV2,
  stubWorkspace,
  stubWorkspaceFile,
  stubWorkspaceFolders,
} from "./testUtilsv2";

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
  preActivateHook?: any;
  postActivateHook?: any;
  preSetupHook?: PreSetupHookFunction;
  postSetupHook?: PostSetupWorkspaceHook;
  setupWsOverride?: Partial<SetupWorkspaceOpts>;
  wsSettingsOverride?: Partial<WorkspaceSettings>;
};

export async function setupWorkspace() {}

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
  setupCodeConfiguration(opts);
  // setup workspace file
  stubWorkspace({ wsRoot, vaults });
  const workspaceFile = DendronWorkspace.workspaceFile();
  const workspaceFolders = DendronWorkspace.workspaceFolders();

  // setup
  WorkspaceConfig.write(wsRoot, { overrides: wsSettingsOverride });
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
  const config = DConfig.getOrCreate(wsRoot);
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

export function setupBeforeAfter(_this: any, opts?: { beforeHook?: any }) {
  let ctx: ExtensionContext;
  _this.timeout(TIMEOUT);
  ctx = VSCodeUtils.getOrCreateMockContext();
  beforeEach(async function () {
    DendronWorkspace.getOrCreate(ctx);
    opts?.beforeHook && (await opts.beforeHook());
  });
  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });
  return ctx;
}

export function stubSetupWorkspace({
  wsRoot,
  initType,
}: {
  wsRoot: string;
  initType: InitializeType;
}) {
  // @ts-ignore
  VSCodeUtils.gatherFolderPath = () => {
    return wsRoot;
  };
  switch (initType) {
    case InitializeType.EMPTY:
      // @ts-ignore
      VSCodeUtils.showQuickPick = () => {
        return "initialize empty repository";
      };
      break;
    default:
      throw Error(`inittype ${initType} not handled`);
  }
}

class FakeEngine {
  get notes() {
    return getWS().getEngine().notes;
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
  ): DEngineClientV2 => {
    const engine = new FakeEngine() as DEngineClientV2;
    _.map(overrides || {}, (method, key: keyof DendronEngineV2) => {
      // @ts-ignore
      engine[key] = method(opts);
    });
    return engine;
  };
  return createEngine;
};
