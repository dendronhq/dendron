import chokidar from "chokidar";
import path from "path";

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
  constructor(base: string, pattern: string, onReady?: () => void) {
    // Chokidar requires paths with globs to use POSIX `/` separators, even on Windows
    const patternWithBase = `${path.posix.normalize(base)}/${pattern}`;
    this.watcher = chokidar.watch(patternWithBase, {
      disableGlobbing: false,
      ignoreInitial: true,
    });
    if (onReady) this.watcher.on("ready", onReady);
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
