/** Mimicks VSCode's disposable for cross-compatibility. */
export type Disposable = {
  dispose: () => any;
};
