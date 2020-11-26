import { DVault, NotePropsV2, WorkspaceOpts } from "@dendronhq/common-all";
import {
  assignJSONWithComment,
  file2Note,
  tmpDir,
  VaultUtils,
} from "@dendronhq/common-server";
import {
  EngineOpt,
  EngineTestUtilsV2,
  EngineTestUtilsV3,
  ENGINE_HOOKS,
  NotePresetsUtils,
  PreSetupHookFunction,
  SetupHookFunction,
  SetupWSOpts,
} from "@dendronhq/common-test-utils";
import { DConfig } from "@dendronhq/engine-server";
import assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ExtensionContext, Location, Position, Uri, window } from "vscode";
import {
  SetupWorkspaceCommand,
  SetupWorkspaceOpts,
} from "../commands/SetupWorkspace";
import { CONFIG } from "../constants";
import { WorkspaceFolderRaw } from "../types";
import { DendronWorkspace, resolveRelToWSRoot } from "../workspace";
import { _activate } from "../_extension";
import { createMockConfig, onWSInit } from "./testUtils";

export type SetupCodeConfigurationV2 = {
  configOverride?: { [key: string]: any };
};

type SetupCodeWorkspaceV2 = SetupWSOpts &
  SetupCodeConfigurationV2 & {
    ctx: ExtensionContext;
    preActivateHook?: any;
    postActivateHook?: any;
    preSetupHook?: PreSetupHookFunction;
    postSetupHook?: SetupHookFunction;
  };

export type SetupCodeWorkspaceMultiVaultV2Opts = SetupCodeConfigurationV2 & {
  ctx: ExtensionContext;
  preActivateHook?: any;
  postActivateHook?: any;
  preSetupHook?: SetupHookFunction;
  postSetupHook?: SetupHookFunction;
  setupWsOverride?: Partial<SetupWorkspaceOpts>;
};

export function genEmptyWSFiles() {
  return [".vscode", "root.md", "root.schema.yml"];
}

export function genTutorialWSFiles() {
  return [...genEmptyWSFiles(), "dendron.md", "dendron.welcome.md"].sort();
}

export function genDefaultSettings() {
  return {
    extensions: {
      recommendations: [
        "dendron.dendron-paste-image",
        "equinusocio.vsc-material-theme",
        "dendron.dendron-markdown-shortcuts",
        "dendron.dendron-markdown-preview-enhanced",
        "dendron.dendron-markdown-links",
        "github.github-vscode-theme",
      ],
      unwantedRecommendations: [
        "dendron.dendron-markdown-notes",
        "shd101wyy.markdown-preview-enhanced",
        "kortina.vscode-markdown-notes",
        "mushan.vscode-paste-image",
      ],
    },
    folders: [
      {
        path: "vault",
      },
    ],
    settings: {
      "dendron.rootDir": ".",
      "editor.snippetSuggestions": "inline",
      "editor.suggest.showSnippets": true,
      "editor.suggest.snippetsPreventQuickSuggestions": false,
      "editor.tabCompletion": "on",
      "files.autoSave": "onFocusChange",
      "markdown-preview-enhanced.enableWikiLinkSyntax": true,
      "markdown-preview-enhanced.wikiLinkFileExtension": ".md",
      "pasteImage.path": "${currentFileDir}/assets/images",
      "pasteImage.prefix": "/",
    },
  };
}

export async function runSingleVaultTest(
  opts: SetupCodeWorkspaceV2 & {
    onInit: (opts: { vault: DVault; wsRoot: string }) => Promise<void>;
  }
) {
  let wsRoot = tmpDir().name;
  let vault = { fsPath: tmpDir().name };
  const { ctx, onInit } = opts;
  await setupCodeWorkspaceV2(
    _.defaults(opts, {
      wsRoot,
      initDirCb: async () => {
        //const vaults = [vault];
        await ENGINE_HOOKS.setupBasic({ vaults: [vault], wsRoot });
      },
      vaultDir: vault.fsPath,
    })
  );
  onWSInit(async () => {
    await onInit({ vault, wsRoot });
  });
  await _activate(ctx);
}

export async function runMultiVaultTest(
  opts: SetupCodeWorkspaceMultiVaultV2Opts & {
    onInit: (opts: { vaults: DVault[]; wsRoot: string }) => Promise<void>;
  }
) {
  const { ctx } = opts;
  const { vaults, wsRoot } = await setupCodeWorkspaceMultiVaultV2(opts);
  onWSInit(async () => {
    await opts.onInit({ wsRoot, vaults });
  });
  await _activate(ctx);
}

export async function runWorkspaceTestV3(
  opts: SetupCodeWorkspaceMultiVaultV2Opts & {
    onInit: (opts: WorkspaceOpts & EngineOpt) => Promise<void>;
  }
) {
  const { ctx } = opts;
  const { vaults, wsRoot } = await setupCodeWorkspaceV3(opts);
  onWSInit(async () => {
    const engine = DendronWorkspace.instance().getEngine();
    await opts.onInit({ wsRoot, vaults, engine });
  });
  opts?.preActivateHook ? await opts.preActivateHook() : null;
  await _activate(ctx);
}

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

export async function resetCodeWorkspace() {
  // @ts-ignore
  DendronWorkspace.workspaceFile = () => {
    return undefined;
  };
  // @ts-ignore
  DendronWorkspace.workspaceFolders = () => {
    return undefined;
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
  let setupWsOverride = copts.setupWsOverride as Partial<SetupWorkspaceOpts>;
  setupCodeConfiguration(opts);
  if (opts.vaultDir) {
    setupWsOverride.vault = { fsPath: opts.vaultDir };
  }
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
    ...setupWsOverride,
  });
  DendronWorkspace.updateWorkspaceFile({
    updateCb: (settings) => {
      const folders = vaults.map((ent) => ({ path: ent }));
      settings = assignJSONWithComment({ folders }, settings);
      return settings;
    },
  });
  await postSetupHook({
    wsRoot,
    vaults: vaults.map((ent) => {
      return { fsPath: ent };
    }),
  });
  return { wsRoot, vaults, workspaceFile, workspaceFolders };
}

export async function setupCodeWorkspaceMultiVaultV2(
  opts: SetupCodeWorkspaceMultiVaultV2Opts
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
  stubWorkspace({ wsRoot, vaults });
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
 * Used for setup workspace test
 */
export async function setupCodeWorkspaceV3(
  opts: SetupCodeWorkspaceMultiVaultV2Opts
) {
  const copts = _.defaults(opts, {
    setupWsOverride: {
      skipConfirmation: true,
      emptyWs: true,
    },
    preSetupHook: async () => {},
    postSetupHook: async () => {},
  });
  const wsContainer = tmpDir().name;
  setupCodeConfiguration(opts);
  const wsRoot = path.join(wsContainer, "dendron");
  fs.ensureDirSync(wsRoot);
  DendronWorkspace.workspaceFile = () => {
    return Uri.file(path.join(wsRoot, "dendron.code-workspace"));
  };
  const workspaceFile = DendronWorkspace.workspaceFile();
  const workspaceFolders = DendronWorkspace.workspaceFolders();
  const vaults = await new SetupWorkspaceCommand().execute({
    rootDirRaw: wsRoot,
    skipOpenWs: true,
    ...copts.setupWsOverride,
  });
  DendronWorkspace.workspaceFolders = () => {
    return vaults.map((v) => ({
      name: v.name || path.basename(v.fsPath),
      index: 1,
      uri: Uri.file(v.fsPath),
    }));
  };
  return { wsRoot, vaults, workspaceFile, workspaceFolders };
}

export const getNoteFromTextEditor = (): NotePropsV2 => {
  const txtPath = window.activeTextEditor?.document.uri.fsPath as string;
  const vault = { fsPath: path.dirname(txtPath) };
  const node = file2Note(txtPath, vault);
  return node;
};

export class LocationTestUtils {
  /**
   * get default wiki link position
   */
  static getPresetWikiLinkPosition = (opts?: {
    line?: number;
    char?: number;
  }) => new Position(opts?.line || 7, opts?.char || 2);
  static getBasenameFromLocation = (loc: Location) =>
    path.basename(loc.uri.fsPath);
}
export const stubWorkspaceFile = (wsRoot: string) => {
  DendronWorkspace.workspaceFile = () => {
    return Uri.file(path.join(wsRoot, "dendron.code-workspace"));
  };
};

export const stubWorkspaceFolders = (vaults: DVault[]) => {
  DendronWorkspace.workspaceFolders = () => {
    return vaults.map((v) => ({
      name: VaultUtils.getName(v),
      index: 1,
      uri: Uri.file(resolveRelToWSRoot(v.fsPath)),
    }));
  };
};

export const stubWorkspace = ({ wsRoot, vaults }: WorkspaceOpts) => {
  stubWorkspaceFile(wsRoot);
  stubWorkspaceFolders(vaults);
};

export function expect(value: any) {
  return {
    toEqual: (value2: any) => {
      assert.deepStrictEqual(value, value2);
    },
    toBeTruthy: () => {
      assert.ok(value);
    },
    toBeFalsy: () => {
      assert.ok(_.isUndefined(value) || !value);
    },
  };
}
