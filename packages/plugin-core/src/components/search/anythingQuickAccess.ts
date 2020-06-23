import { CancellationToken, QuickPickItem } from "vscode";
import { DisposableStore, IDisposable } from "../../vs/base/common/lifecycle";
import {
  IPickerQuickAccessItem,
  PickerQuickAccessProvider,
  Picks,
} from "../../vs/platform/quickinput/browser/pickerQuickAccess";
import {
  IQuickPick,
  IQuickPickItemWithResource,
} from "../../vs/base/parts/quickinput/common/quickInput";

interface IAnythingQuickPickItem
  extends IPickerQuickAccessItem,
    IQuickPickItemWithResource {}

export class AnythingQuickAccessProvider extends PickerQuickAccessProvider<
  IAnythingQuickPickItem
> {
  provide(
    picker: IQuickPick<IAnythingQuickPickItem>,
    token: CancellationToken
  ): IDisposable {
    const disposables = new DisposableStore();

    // TAG:PARTIAL

    // Start picker
    disposables.add(super.provide(picker, token));

    return disposables;
  }
  protected getPicks(
    originalFilter: string,
    disposables: DisposableStore,
    token: CancellationToken
  ): Picks<IAnythingQuickPickItem> {
    // | null // | FastAndSlowPicks<IAnythingQuickPickItem> // | Promise<Picks<IAnythingQuickPickItem>>
    // TODO
    const getQuickPickItems = (): IAnythingQuickPickItem[] => {
      return [
        {
          label: "foo.exists",
          description: "description $(list-tree)",
          detail: "detail. this detail will go on for a while",
        },
        {
          label: "foo.no_exist",
          description: "description $(list-tree)",
          detail: "detail. this detail will go on for a while",
        },
      ];
    };
    return getQuickPickItems();
  }
}
