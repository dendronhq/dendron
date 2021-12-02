import { resolveTilde } from "@dendronhq/common-server";
import ogs from "open-graph-scraper";
import os from "os";
import path from "path";
import * as vscode from "vscode";

export class DisposableStore {
  private _toDispose = new Set<vscode.Disposable>();

  public add(dis: vscode.Disposable) {
    this._toDispose.add(dis);
  }

  public dispose() {
    // eslint-disable-next-line no-restricted-syntax
    for (const disposable of this._toDispose) {
      disposable.dispose();
    }
  }
}

// === File FUtils
// @DEPRECATE, use src/files.ts#resolvePath
/**
 * @deprecated use src/files.ts#resolvePath
 * @param filePath
 * @param wsRoot
 * @returns
 */
export function resolvePath(filePath: string, wsRoot?: string): string {
  const platform = os.platform();

  const isWin = platform === "win32";
  if (filePath[0] === "~") {
    return resolveTilde(filePath);
  } else if (
    path.isAbsolute(filePath) ||
    (isWin && filePath.startsWith("\\"))
  ) {
    return filePath;
  } else {
    if (!wsRoot) {
      throw Error("can't use rel path without a workspace root set");
    }
    return path.join(wsRoot, filePath);
  }
}

export function getPlatform() {
  return process.platform;
}

export class FileUtils {
  static escape(fpath: string) {
    return fpath.replace(/(\s+)/g, "\\$1");
  }
}

export const clipboard = vscode.env.clipboard;

export const showMessage = {
  info: vscode.window.showInformationMessage,
  warning: vscode.window.showWarningMessage,
};

// This layer of indirection is only here enable stubbing a top level function that's the default export of a module // https://github.com/sinonjs/sinon/issues/562#issuecomment-399090111
// Otherwise, we can't mock it for testing.
export const getOpenGraphMetadata = (opts: ogs.Options) => {
  return ogs(opts);
};
