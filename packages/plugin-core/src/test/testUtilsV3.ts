import { WorkspaceOpts } from "@dendronhq/common-all";
import { assignJSONWithComment, tmpDir } from "@dendronhq/common-server";
import {
  EngineOpt,
  EngineTestUtilsV3,
  NotePresetsUtils,
  PreSetupCmdHookFunction,
  PreSetupHookFunction,
} from "@dendronhq/common-test-utils";
import { DConfig } from "@dendronhq/engine-server";
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
import { WorkspaceFolderRaw } from "../types";
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
};

async function setupLegacyWorkspace(opts: SetupLegacyWorkspaceOpts) {
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

async function setupLegacyWorkspaceMulti(opts: SetupLegacyWorkspaceMultiOpts) {
  const copts = _.defaults(opts, {
    setupWsOverride: {
      skipConfirmation: true,
      emptyWs: true,
    },
    preSetupHook: async () => {},
    postSetupHook: async () => {},
  });
  const { preSetupHook, postSetupHook } = copts;
  const { wsRoot, vaults } = await EngineTestUtilsV3.setupWS({
    ...opts,
    initVault1: async (vaultDir: string) => {
      await NotePresetsUtils.createBasic({ vaultDir, fname: "foo" });
    },
    initVault2: async (vaultDir: string) => {
      await NotePresetsUtils.createBasic({ vaultDir, fname: "bar" });
    },
  });
  setupCodeConfiguration(opts);
  // setup workspace file
  stubWorkspace({ wsRoot, vaults });
  const workspaceFile = DendronWorkspace.workspaceFile();
  const workspaceFolders = DendronWorkspace.workspaceFolders();

  // setup
  WorkspaceConfig.write(wsRoot);
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
