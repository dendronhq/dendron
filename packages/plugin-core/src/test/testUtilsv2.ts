import { DVault, NotePropsV2 } from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import {
  EngineTestUtilsV2,
  EngineTestUtilsV3,
  NotePresetsUtils,
  SetupWSOpts,
} from "@dendronhq/common-test-utils";
import { DConfig } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { ExtensionContext, Uri, window } from "vscode";
import { SetupWorkspaceCommand } from "../commands/SetupWorkspace";
import { CONFIG } from "../constants";
import { DendronWorkspace } from "../workspace";
import { createMockConfig } from "./testUtils";

type SetupCodeConfigurationV2 = {
  configOverride?: { [key: string]: any };
};

type SetupHookFunction = (opts: {
  wsRoot: string;
  vaults: DVault[];
}) => Promise<void>;

type SetupCodeWorkspaceV2 = SetupWSOpts &
  SetupCodeConfigurationV2 & {
    ctx: ExtensionContext;
    preActivateHook?: any;
    postActivateHook?: any;
    preSetupHook?: SetupHookFunction;
    postSetupHook?: SetupHookFunction;
  };

type SetupCodeWorkspaceMultiVaultV2 = SetupCodeConfigurationV2 & {
  ctx: ExtensionContext;
  preActivateHook?: any;
  postActivateHook?: any;
  preSetupHook?: SetupHookFunction;
  postSetupHook?: SetupHookFunction;
};

export function setupCodeConfiguration(opts: SetupCodeConfigurationV2) {
  const copts = _.defaults(opts, {
    configOverride: {},
  });
  DendronWorkspace.configuration = () => {
    const config: any = {
      dendron: {
        rootDir: ".",
      },
    };
    _.forEach(CONFIG, (ent) => {
      if (ent.default) {
        _.set(config, ent.key, ent.default);
      }
    });
    _.forEach(copts.configOverride, (v, k) => {
      _.set(config, k, v);
    });
    return createMockConfig(config);
  };
}

export async function setupCodeWorkspaceV2(opts: SetupCodeWorkspaceV2) {
  const copts = _.defaults(opts, {
    setupWsOverride: {
      skipConfirmation: true,
      emptyWs: true,
    },
    preSetupHook: async () => {},
    postSetupHook: async () => {},
  });
  const { preSetupHook, postSetupHook } = copts;
  const { wsRoot, vaults } = await EngineTestUtilsV2.setupWS(opts);
  setupCodeConfiguration(opts);
  // setup workspace file
  DendronWorkspace.workspaceFile = () => {
    return Uri.file(path.join(wsRoot, "dendron.code-workspace"));
  };
  DendronWorkspace.workspaceFolders = () => {
    const uri = Uri.file(path.join(wsRoot, "vault"));
    return [{ uri, name: "vault", index: 0 }];
  };
  const workspaceFile = DendronWorkspace.workspaceFile();
  const workspaceFolders = DendronWorkspace.workspaceFolders();
  await preSetupHook({
    wsRoot,
    vaults: vaults.map((ent) => {
      return { fsPath: ent };
    }),
  });
  await new SetupWorkspaceCommand().execute({
    rootDirRaw: wsRoot,
    skipOpenWs: true,
    ...copts.setupWsOverride,
  });
  await postSetupHook({
    wsRoot,
    vaults: vaults.map((ent) => {
      return { fsPath: ent };
    }),
  });
  const config = DConfig.getOrCreate(wsRoot);
  config.vaults = vaults.map((ent) => ({ fsPath: ent }));
  DConfig.writeConfig({ wsRoot, config });
  return { wsRoot, vaults, workspaceFile, workspaceFolders };
}

export async function setupCodeWorkspaceMultiVaultV2(
  opts: SetupCodeWorkspaceMultiVaultV2
) {
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
  DendronWorkspace.workspaceFile = () => {
    return Uri.file(path.join(wsRoot, "dendron.code-workspace"));
  };
  DendronWorkspace.workspaceFolders = () => {
    const uri = Uri.file(path.join(wsRoot, "vault"));
    return [{ uri, name: "vault", index: 0 }];
  };
  const workspaceFile = DendronWorkspace.workspaceFile();
  const workspaceFolders = DendronWorkspace.workspaceFolders();
  await preSetupHook({
    wsRoot,
    vaults,
  });
  await new SetupWorkspaceCommand().execute({
    rootDirRaw: wsRoot,
    skipOpenWs: true,
    ...copts.setupWsOverride,
  });
  const config = DConfig.getOrCreate(wsRoot);
  config.vaults = vaults;
  DConfig.writeConfig({ wsRoot, config });
  await postSetupHook({
    wsRoot,
    vaults,
  });
  return { wsRoot, vaults, workspaceFile, workspaceFolders };
}

export const getNoteFromTextEditor = (): NotePropsV2 => {
  const txtPath = window.activeTextEditor?.document.uri.fsPath as string;
  const vault = { fsPath: path.dirname(txtPath) };
  const node = file2Note(txtPath, vault);
  return node;
};
