import chokidar from "chokidar";

/** Mimicks VSCode's disposable for cross-compatibility. */
type Disposable = {
  dispose: () => any;
};

type SupportedEvents = "add" | "addDir" | "change" | "unlink" | "unlinkDir";

export type FileWatcherAdapter = {
  onDidCreate(callback: (filePath: string) => void): Disposable;
  onDidDelete(callback: (filePath: string) => void): Disposable;
  onDidChange(callback: (filePath: string) => void): Disposable;
};

export class EngineFileWatcher implements FileWatcherAdapter {
  private watcher: chokidar.FSWatcher;
  constructor(paths: string | string[]) {
    this.watcher = chokidar.watch(paths, { disableGlobbing: false });
  }

  private onEvent(
    event: SupportedEvents,
    callback: (filePath: string) => void
  ): Disposable {
    this.watcher.on(event, callback);
    return {
      dispose: () => {
        this.watcher.removeAllListeners(event);
      },
    };
  }

  onDidCreate(callback: (filePath: string) => void) {
    return this.onEvent("add", callback);
  }

  onDidDelete(callback: (filePath: string) => void): Disposable {
    return this.onEvent("unlink", callback);
  }

  onDidChange(callback: (filePath: string) => void): Disposable {
    return this.onEvent("change", callback);
  }
}
