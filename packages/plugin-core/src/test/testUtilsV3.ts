import { WorkspaceOpts } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { EngineOpt, PreSetupHookFunction } from "@dendronhq/common-test-utils";
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
import { VSCodeUtils } from "../utils";
import { DendronWorkspace, getWS } from "../workspace";
import { _activate } from "../_extension";
import { onWSInit, TIMEOUT } from "./testUtils";
import {
  setupCodeConfiguration,
  SetupCodeConfigurationV2,
  stubWorkspaceFile,
  stubWorkspaceFolders,
} from "./testUtilsv2";

type OnInitHook = (opts: WorkspaceOpts & EngineOpt) => Promise<void>;

type PostSetupWorkspaceHook = (opts: WorkspaceOpts) => Promise<void>;

export type SetupLegacyWorkspaceOpts = SetupCodeConfigurationV2 & {
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

export function runLegacyMultiWorkspaceTest() {}

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
