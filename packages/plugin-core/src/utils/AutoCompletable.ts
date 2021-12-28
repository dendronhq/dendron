/**
 * Auto Completable is an interface that should be implemented by commands
 * which are envisioned to support auto complete functionality. It is mostly
 * geared towards lookup functionality of allowing to auto complete the
 * lookup results.
 *
 * Currently just implementation of this interface does NOT enable auto
 * complete and a trigger command needs to be setup to actually call the
 * method of {@link AutoCompletable#onAutoComplete}.
 *
 * Commands that do implement this interface will be automatically registered
 * with AutoCompletableRegistrar during initialization.
 * */
export type AutoCompletable = {
  /**
   * When auto complete is triggered and calls upon this function the
   * command should implement the logic for auto completion of current state.
   * */
  onAutoComplete: () => Promise<void>;
};

export const isAutoCompletable = (cmd: any): cmd is AutoCompletable => {
  return (cmd as AutoCompletable).onAutoComplete !== undefined;
};
