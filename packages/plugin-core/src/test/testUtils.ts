import _ from "lodash";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
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

export function setupWorkspace(root: string, opts?: { lsp: boolean }) {
  DendronWorkspace.configuration = () => {
    return createMockConfig({
      dendron: {
        rootDir: ".",
        useExperimentalLSPSupport: opts?.lsp ? true : false,
      },
    });
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
