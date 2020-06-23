import {
  CancellationToken,
  CancellationTokenSource,
  QuickPickItem,
} from "vscode";
import {
  DefaultQuickAccessFilterValue,
  IQuickAccessProvider,
} from "../common/quickAccess";
import {
  Disposable,
  DisposableStore,
  IDisposable,
  MutableDisposable,
} from "../../../base/common/lifecycle";

import { IQuickPick } from "../../../base/parts/quickinput/common/quickInput";

export enum TriggerAction {
  /**
   * Do nothing after the button was clicked.
   */
  NO_ACTION,

  /**
   * Close the picker.
   */
  CLOSE_PICKER,

  /**
   * Update the results of the picker.
   */
  REFRESH_PICKER,

  /**
   * Remove the item from the picker.
   */
  REMOVE_ITEM,
}

export interface IPickerQuickAccessProviderOptions<
  T extends IPickerQuickAccessItem
> {
  /**
   * Enables support for opening picks in the background via gesture.
   */
  canAcceptInBackground?: boolean;

  /**
   * Enables to show a pick entry when no results are returned from a search.
   */
  noResultsPick?: T;
}

export type IPickerQuickAccessItem = QuickPickItem;
// export interface IPickerQuickAccessItem extends IQuickPickItem {
//   /**
//    * A method that will be executed when the pick item is accepted from
//    * the picker. The picker will close automatically before running this.
//    *
//    * @param keyMods the state of modifier keys when the item was accepted.
//    * @param event the underlying event that caused the accept to trigger.
//    */
//   accept?(keyMods: IKeyMods, event: IQuickPickAcceptEvent): void;

//   /**
//    * A method that will be executed when a button of the pick item was
//    * clicked on.
//    *
//    * @param buttonIndex index of the button of the item that
//    * was clicked.
//    *
//    * @param the state of modifier keys when the button was triggered.
//    *
//    * @returns a value that indicates what should happen after the trigger
//    * which can be a `Promise` for long running operations.
//    */
//   trigger?(
//     buttonIndex: number,
//     keyMods: IKeyMods
//   ): TriggerAction | Promise<TriggerAction>;
// }

export type Pick<T> = T; // | IQuickPickSeparator;
export type PicksWithActive<T> = { items: ReadonlyArray<Pick<T>>; active?: T };
export type Picks<T> = ReadonlyArray<Pick<T>> | PicksWithActive<T>;
export type FastAndSlowPicks<T> = {
  picks: Picks<T>;
  additionalPicks: Promise<Picks<T>>;
};
export type FastAndSlowPicksWithActive<T> = {
  picks: PicksWithActive<T>;
  additionalPicks: PicksWithActive<Picks<T>>;
};

function isPicksWithActive<T>(obj: unknown): obj is PicksWithActive<T> {
  const candidate = obj as PicksWithActive<T>;

  return Array.isArray(candidate.items);
}

function isFastAndSlowPicks<T>(obj: unknown): obj is FastAndSlowPicks<T> {
  const candidate = obj as FastAndSlowPicks<T>;

  return !!candidate.picks && candidate.additionalPicks instanceof Promise;
}

export abstract class PickerQuickAccessProvider<
  T extends IPickerQuickAccessItem
> extends Disposable implements IQuickAccessProvider {
  defaultFilterValue?: string | DefaultQuickAccessFilterValue;
  constructor(
    private prefix: string,
    protected options?: IPickerQuickAccessProviderOptions<T>
  ) {
    super();
  }
  provide(picker: IQuickPick<T>, token: CancellationToken): IDisposable {
    const disposables = new DisposableStore();
    let picksCts: CancellationTokenSource | undefined = undefined;
    const picksDisposable = disposables.add(new MutableDisposable());
    const updatePickerItems = async () => {
      const picksDisposables = (picksDisposable.value = new DisposableStore());
      // Cancel any previous ask for picks and busy
      picksCts?.dispose();
      picker.busy = false;

      // Create new cancellation source for this run
      picksCts = new CancellationTokenSource();
      // picksCts.token = token;

      // Collect picks and support both long running and short or combined
      const picksToken = picksCts.token;
      const picksFilter = picker.value.substr(this.prefix.length).trim();
      // TAGS:PART
      const providedPicks = this.getPicks(
        picksFilter,
        picksDisposables,
        picksToken
      );

      const applyPicks = (picks: Picks<T>, skipEmpty?: boolean): boolean => {
        let items: ReadonlyArray<Pick<T>>;
        let activeItem: T | undefined = undefined;

        if (isPicksWithActive(picks)) {
          items = picks.items;
          activeItem = picks.active;
        } else {
          items = picks;
        }

        if (items.length === 0) {
          if (skipEmpty) {
            return false;
          }

          if (picksFilter.length > 0 && this.options?.noResultsPick) {
            items = [this.options.noResultsPick];
          }
        }

        picker.items = items;
        if (activeItem) {
          picker.activeItems = [activeItem];
        }

        return true;
      };

      if (providedPicks === null) {
        // Ignore
      } else if (isFastAndSlowPicks(providedPicks)) {
        let fastPicksApplied = false;
        let slowPicksApplied = false;

        await Promise.all([
          // Fast Picks: to reduce amount of flicker, we race against
          // the slow picks over 500ms and then set the fast picks.
          // If the slow picks are faster, we reduce the flicker by
          // only setting the items once.
          (async () => {
            // TODO
            //await timeout(PickerQuickAccessProvider.FAST_PICKS_RACE_DELAY);
            if (picksToken.isCancellationRequested) {
              return;
            }

            if (!slowPicksApplied) {
              fastPicksApplied = applyPicks(
                providedPicks.picks,
                true /* skip over empty to reduce flicker */
              );
            }
          })(),

          // Slow Picks: we await the slow picks and then set them at
          // once together with the fast picks, but only if we actually
          // have additional results.
          (async () => {
            picker.busy = true;
            try {
              const awaitedAdditionalPicks = await providedPicks.additionalPicks;
              if (picksToken.isCancellationRequested) {
                return;
              }

              let picks: ReadonlyArray<Pick<T>>;
              let activePick: Pick<T> | undefined = undefined;
              if (isPicksWithActive(providedPicks.picks)) {
                picks = providedPicks.picks.items;
                activePick = providedPicks.picks.active;
              } else {
                picks = providedPicks.picks;
              }

              let additionalPicks: ReadonlyArray<Pick<T>>;
              let additionalActivePick: Pick<T> | undefined = undefined;
              if (isPicksWithActive(awaitedAdditionalPicks)) {
                additionalPicks = awaitedAdditionalPicks.items;
                additionalActivePick = awaitedAdditionalPicks.active;
              } else {
                additionalPicks = awaitedAdditionalPicks;
              }

              if (additionalPicks.length > 0 || !fastPicksApplied) {
                applyPicks({
                  items: [...picks, ...additionalPicks],
                  active: activePick || additionalActivePick,
                });
              }
            } finally {
              if (!picksToken.isCancellationRequested) {
                picker.busy = false;
              }

              slowPicksApplied = true;
            }
          })(),
        ]);
      }

      // Fast Picks
      else if (!(providedPicks instanceof Promise)) {
        applyPicks(providedPicks);
      } else {
        picker.busy = true;
        try {
          const awaitedPicks = await providedPicks;
          if (picksToken.isCancellationRequested) {
            return;
          }

          applyPicks(awaitedPicks);
        } finally {
          if (!picksToken.isCancellationRequested) {
            picker.busy = false;
          }
        }
      }
    };
    disposables.add(picker.onDidChangeValue(() => updatePickerItems()));
    updatePickerItems();
    disposables.add(
      picker.onDidAccept((event) => {
        const [item] = picker.selectedItems;
        console.log("accepted");
        // if (typeof item?.accept === "function") {
        //   if (!event.inBackground) {
        //     picker.hide(); // hide picker unless we accept in background
        //   }

        //   item.accept(picker.keyMods, event);
        // }
      })
    );
    // disposables.add(
    //   picker.onDidTriggerItemButton(async ({ button, item }) => {
    //     // TAG:PART
    //     // TODO
    //   })
    // );
    return disposables;
  }

  protected abstract getPicks(
    filter: string,
    disposables: DisposableStore,
    token: CancellationToken
  ): Picks<T> | Promise<Picks<T>> | FastAndSlowPicks<T> | null;
}
