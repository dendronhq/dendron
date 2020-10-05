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
import { HistoryEvent, HistoryService } from "../services/HistoryService";
import { DendronWorkspace } from "../workspace";

function createMockConfig(settings: any): vscode.WorkspaceConfiguration {
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

export function setupWorkspace(
  root: string,
  opts?: { lsp?: boolean; configOverride?: any }
) {
  DendronWorkspace.configuration = () => {
    const config: any = {
      dendron: {
        rootDir: ".",
        useExperimentalLSPSupport: opts?.lsp ? true : false,
      },
    };
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

export function setupDendronWorkspace(
  rootDir: string,
  ctx: vscode.ExtensionContext,
  opts?: {
    configOverride?: any;
    setupWsOverride?: Partial<SetupWorkspaceOpts>;
    useCb?: (vaultPath: string) => Promise<void>;
    activateWorkspace?: boolean;
    lsp?: boolean;
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
    lsp: false,
  });

  if (optsClean.activateWorkspace) {
    DendronWorkspace.isActive = () => true;
  }

  const { workspaceFolders } = setupWorkspace(rootDir, {
    configOverride: optsClean.configOverride,
    lsp: optsClean.lsp,
  });
  const wsFolder = (workspaceFolders as vscode.WorkspaceFolder[])[0];
  return new SetupWorkspaceCommand()
    .execute({
      rootDirRaw: rootDir,
      skipOpenWs: true,
      ...optsClean.setupWsOverride,
    })
    .then(async () => {
      await optsClean.useCb(wsFolder.uri.fsPath);
      return _activate(ctx);
    });
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

export const TIMEOUT = 60 * 1000 * 5;
