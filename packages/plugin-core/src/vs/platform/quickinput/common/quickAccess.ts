import { CancellationToken, QuickPick, QuickPickItem } from "vscode";

import { IDisposable } from "../../../base/common/lifecycle";

export enum DefaultQuickAccessFilterValue {
  /**
   * Keep the value as it is given to quick access.
   */
  PRESERVE = 0,

  /**
   * Use the value that was used last time something was accepted from the picker.
   */
  LAST = 1,
}

export interface IQuickAccessOptions {
  /**
   * Allows to enable quick navigate support in quick input.
   */
  //quickNavigateConfiguration?: IQuickNavigateConfiguration;

  /**
   * Allows to configure a different item activation strategy.
   * By default the first item in the list will get activated.
   */
  //itemActivation?: ItemActivation;

  /**
   * Whether to take the input value as is and not restore it
   * from any existing value if quick access is visible.
   */
  preserveValue?: boolean;
}

export interface IQuickAccessController {
  /**
   * Open the quick access picker with the optional value prefilled.
   */
  show(value?: string, options?: IQuickAccessOptions): void;
}

export interface IQuickAccessProvider {
  /**
   * Allows to set a default filter value when the provider opens. This can be:
   * - `undefined` to not specify any default value
   * - `DefaultFilterValues.PRESERVE` to use the value that was last typed
   * - `string` for the actual value to use
   *
   * Note: the default filter will only be used if quick access was opened with
   * the exact prefix of the provider. Otherwise the filter value is preserved.
   */
  readonly defaultFilterValue?: string | DefaultQuickAccessFilterValue;

  /**
   * Called whenever a prefix was typed into quick pick that matches the provider.
   *
   * @param picker the picker to use for showing provider results. The picker is
   * automatically shown after the method returns, no need to call `show()`.
   * @param token providers have to check the cancellation token everytime after
   * a long running operation or from event handlers because it could be that the
   * picker has been closed or changed meanwhile. The token can be used to find out
   * that the picker was closed without picking an entry (e.g. was canceled by the user).
   * @return a disposable that will automatically be disposed when the picker
   * closes or is replaced by another picker.
   */
  provide(
    //picker: IQuickPick<IQuickPickItem>,
    picker: QuickPick<QuickPickItem>,
    token: CancellationToken
  ): IDisposable;
}
