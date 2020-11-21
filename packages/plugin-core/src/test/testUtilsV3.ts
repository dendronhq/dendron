import { WorkspaceOpts } from "@dendronhq/common-all";
import { afterEach, beforeEach } from "mocha";
import { tmpDir } from "@dendronhq/common-server";
import {
  PostSetupHookFunction,
  SetupHookFunction,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { ExtensionContext } from "vscode";
import {
  SetupWorkspaceCommand,
  SetupWorkspaceOpts,
} from "../commands/SetupWorkspace";
import { _activate } from "../_extension";
import { onWSInit, TIMEOUT } from "./testUtils";
import {
  setupCodeConfiguration,
  SetupCodeConfigurationV2,
  SetupCodeWorkspaceMultiVaultV2Opts,
  stubWorkspaceFile,
  stubWorkspaceVaults,
} from "./testUtilsv2";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { HistoryService } from "../services/HistoryService";

type OnInitHook = (opts: WorkspaceOpts) => Promise<void>;

export type SetupLegacyWorkspaceOpts = SetupCodeConfigurationV2 & {
  ctx: ExtensionContext;
  preActivateHook?: any;
  postActivateHook?: any;
  preSetupHook?: SetupHookFunction;
  postSetupHook?: PostSetupHookFunction;
  setupWsOverride?: Partial<SetupWorkspaceOpts>;
};

async function setupLegacyWorkspace(opts: SetupCodeWorkspaceMultiVaultV2Opts) {
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

  const vaults = await new SetupWorkspaceCommand().execute({
    rootDirRaw: wsRoot,
    skipOpenWs: true,
    ...copts.setupWsOverride,
  });

  await copts.postSetupHook({
    wsRoot,
    vaults,
  });
  stubWorkspaceVaults(vaults);
  return { wsRoot, vaults };
}

export async function runLegacySingleWorkspaceTest(
  opts: SetupCodeWorkspaceMultiVaultV2Opts & { onInit: OnInitHook }
) {
  const { wsRoot, vaults } = await setupLegacyWorkspace(opts);
  onWSInit(async () => {
    await opts.onInit({ wsRoot, vaults });
  });
  await _activate(opts.ctx);
  return;
}

export function runLegacyMultiWorkspaceTest() {}

export function runSingleWorkspaceTest() {}

export function runMultiWorkspaceTest() {}

export function setupBeforeAfter(_this: any) {
  let ctx: ExtensionContext;
  _this.timeout(TIMEOUT);
  ctx = VSCodeUtils.getOrCreateMockContext();
  beforeEach(function () {
    DendronWorkspace.getOrCreate(ctx);
  });
  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });
  return ctx;
}
