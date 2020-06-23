import * as vscode from "vscode";

import { Disposable, DisposableStore } from "../../../base/common/lifecycle";
import {
  IQuickAccessController,
  IQuickAccessOptions,
  IQuickAccessProvider,
} from "../common/quickAccess";

import { AnythingQuickAccessProvider } from "../../../../components/search/anythingQuickAccess";
import { CancellationTokenSource } from "vscode";
import _ from "lodash";

let QUICK_ACCESS_PROVIDER: IQuickAccessProvider | null = null;

export class QuickAccessController extends Disposable
  implements IQuickAccessController {
  show(value = "", options?: IQuickAccessOptions): void {
    const provider = this.getOrInstantiateProvider(value);
    const disposables = new DisposableStore();
    const picker = disposables.add(vscode.window.createQuickPick());
    picker.ignoreFocusOut = true;
    picker.value = value;
    //const cancellationToken = this.registerPickerListeners(picker, provider, descriptor, value, disposables);
    const cts = disposables.add(new CancellationTokenSource());
    disposables.add(provider.provide(picker, cts.token));
    picker.show();
  }

  private getOrInstantiateProvider(value: string): IQuickAccessProvider {
    if (_.isNull(QUICK_ACCESS_PROVIDER)) {
      QUICK_ACCESS_PROVIDER = new AnythingQuickAccessProvider("", {
        noResultsPick: { label: "Does not exist. Create?" },
      });
    }
    return QUICK_ACCESS_PROVIDER;
  }
}
