import ogs from "open-graph-scraper";
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
