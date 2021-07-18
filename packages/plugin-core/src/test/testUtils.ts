import _ from "lodash";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import {
  SetupWorkspaceCommand,
  SetupWorkspaceOpts,
} from "../commands/SetupWorkspace";
import { CONFIG } from "../constants";
import { _activate } from "../_extension";
import { DendronWorkspace } from "../workspace";
import { DNodePropsQuickInputV2, DVault } from "@dendronhq/common-all";
import { VSCodeUtils } from "../utils";
import fs from "fs-extra";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { DendronBtn } from "../components/lookup/buttons";
import {
  DConfig,
  HistoryEvent,
  HistoryEventAction,
  HistoryService,
} from "@dendronhq/engine-server";
import { BlankInitializer } from "../workspace/blankInitializer";

export function getActiveEditorBasename() {
  return path.basename(
    VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
  );
}

export function createMockConfig(settings: any): vscode.WorkspaceConfiguration {
  const _settings = settings;
  return {
    get: (_key: string) => {
      return _.get(_settings, _key);
    },
    update: async (_key: string, _value: any) => {
      _.set(_settings, _key, _value);
    },
    has: (key: string) => {
      return _.has(_settings, key);
    },
    inspect: (_section: string) => {
      return _settings;
    },
  };
}

type QuickPickOpts = Partial<{
  value: string;
  selectedItems: DNodePropsQuickInputV2[];
  canSelectMany: boolean;
  buttons: DendronBtn[];
}>;

export function createMockQuickPick({
  value,
  selectedItems = [],
  canSelectMany,
  buttons,
}: QuickPickOpts): DendronQuickPickerV2 {
  const qp = vscode.window.createQuickPick<DNodePropsQuickInputV2>();
  if (value) {
    qp.value = value;
  }
  qp.items = selectedItems;
  qp.selectedItems = selectedItems;
  qp.canSelectMany = canSelectMany || false;
  qp.buttons = buttons || [];
  return qp as DendronQuickPickerV2;
}

export function setupWorkspace(
  root: string,
  opts?: { lsp?: boolean; configOverride?: any }
) {
  DendronWorkspace.configuration = () => {
    const config: any = {
      dendron: {
        rootDir: ".",
        useExperimentalLSPSupport: !!opts?.lsp,
      },
    };
    if (_.isUndefined(opts?.lsp)) {
      config["dendron.noServerMode"] = true;
    }
    _.forEach(CONFIG, (ent) => {
      // @ts-ignore
      if (ent.default) {
        // @ts-ignore
        _.set(config, ent.key, ent.default);
      }
    });
    _.forEach(opts?.configOverride || {}, (v, k) => {
      _.set(config, k, v);
    });
    return createMockConfig(config);
  };
  DendronWorkspace.workspaceFile = () => {
    return vscode.Uri.file(path.join(root, "dendron.code-workspace"));
  };
  DendronWorkspace.workspaceFolders = () => {
    const uri = vscode.Uri.file(path.join(root, "vault"));
    return [{ uri, name: "vault", index: 0 }];
  };
  return { workspaceFolders: DendronWorkspace.workspaceFolders() };
}

export async function setupDendronWorkspace(
  rootDir: string,
  ctx: vscode.ExtensionContext,
  opts?: {
    configOverride?: any;
    setupWsOverride?: Partial<SetupWorkspaceOpts>;
    withAssets?: boolean;
    useCb?: (vaultPath: string) => Promise<void>;
    activateWorkspace?: boolean;
    lsp?: boolean;
    vault?: DVault;
  }
) {
  const optsClean = _.defaults(opts, {
    configOverride: {},
    setupWsOverride: {
      skipConfirmation: true,
      emptyWs: true,
    },
    useCb: (_vaultPath: string) => {},
    activateWorkspace: false,
    lsp: true,
  });

  if (optsClean.activateWorkspace) {
    DendronWorkspace.isActive = () => true;
  }

  const { workspaceFolders } = setupWorkspace(rootDir, {
    configOverride: optsClean.configOverride,
    lsp: optsClean.lsp,
  });
  const vaultPath = optsClean.vault?.fsPath
    ? optsClean.vault.fsPath
    : (workspaceFolders as vscode.WorkspaceFolder[])[0].uri.fsPath;
  if (optsClean.withAssets) {
    const assetsDir = path.join(vaultPath, "assets");
    await fs.ensureDir(assetsDir);
    await fs.ensureFile(path.join(assetsDir, "foo.jpg"));
  }
  await new SetupWorkspaceCommand().execute({
    rootDirRaw: rootDir,
    skipOpenWs: true,
    ...optsClean.setupWsOverride,
    workspaceInitializer: new BlankInitializer()
  });
  await optsClean.useCb(vaultPath);
  const config = DConfig.getOrCreate(rootDir);
  config.vaults = [{ fsPath: vaultPath }];
  DConfig.writeConfig({ wsRoot: rootDir, config });
  await _activate(ctx);
  return {
    vaultPath,
  };
}

/**
 * DEPRECATE
 * doesn't mean workspace is active, just that we're done with the
 * welcome message
 * @param cb
 */
export function onWSActive(cb: Function) {
  HistoryService.instance().subscribe(
    "extension",
    async (_event: HistoryEvent) => {
      if (_event.action === "activate") {
        await cb();
      }
    }
  );
}

export function onWSInit(cb: Function) {
  HistoryService.instance().subscribe(
    "extension",
    async (_event: HistoryEvent) => {
      if (_event.action === "initialized") {
        await cb();
      }
    }
  );
}

export function onExtension({
  action,
  cb,
}: {
  action: HistoryEventAction;
  cb: Function;
}) {
  HistoryService.instance().subscribe(
    "extension",
    async (_event: HistoryEvent) => {
      if (_event.action === action) {
        await cb(_event);
      }
    }
  );
}

export function onWatcher({
  action,
  cb,
}: {
  action: HistoryEventAction;
  cb: Function;
}) {
  HistoryService.instance().subscribe(
    "watcher",
    async (_event: HistoryEvent) => {
      if (_event.action === action) {
        await cb();
      }
    }
  );
}

export const TIMEOUT = 60 * 1000 * 5;
