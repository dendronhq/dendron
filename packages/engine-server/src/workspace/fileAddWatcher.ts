import { EngineFileWatcher } from "./fileWatcher";
import _ from "lodash";
import path from "path";
import type { Disposable } from "vscode";
import {
  uniqueOutermostFolders,
  WS_FILE_MAX_SEARCH_DEPTH,
} from "@dendronhq/common-server";

export type AutoInitCallback = (filePath: string) => any;

/** Watches `folders` to see if a `file` is added. Once one is added, the
 * `callback` is run.
 *
 * This will also run if `file` already exists in `folders`. This is necessary
 * to avoid race conditions between FileAddWatcher initializing and the file
 * getting added.
 *
 * **Limitations**: Any folders that start with `.` will not get watched. This
 * makes things more efficient because we don't have to search folders like
 * `.git`. The watcher will also only watch up to some depth, so this might fall
 * short for folders with deep nesting.
 *
 * Remember to dispose this service once you are done to stop watching folders!
 */
export class FileAddWatcher implements Disposable {
  private file: string;
  private fileWatchers: readonly Disposable[] | undefined;
  private callback: AutoInitCallback | undefined;

  private onDidCreate(filePath: string) {
    // Double-check the filename of the file that was created
    if (path.basename(filePath) !== this.file) return;
    if (this.callback) this.callback(filePath);
  }

  /** Watches `folders` to see if a `file` is added. Once one is added, the
   * `callback` is run.
   *
   * This will also run if `file` already exists in `folders`. This is necessary
   * to avoid race conditions between FileAddWatcher initializing and the file
   * getting added.
   *
   * **Limitations**: Any folders that start with `.` will not get watched, as
   * well as some other folders listed in `ENGINE_WATCHER_IGNORES`. Also, we
   * only watch up to a certain depth to limit the performance impact of this.
   *
   * Remember to dispose this service once you are done to stop watching
   * folders!
   */
  public constructor(
    folders: string[],
    file: string,
    callback: AutoInitCallback
  ) {
    const topFolders = uniqueOutermostFolders(folders);
    this.callback = callback;
    this.file = file;
    this.fileWatchers = topFolders.map((folder) =>
      new EngineFileWatcher(folder, `**/${file}`, {
        depth: WS_FILE_MAX_SEARCH_DEPTH,
        ignoreInitial: false,
      }).onDidCreate(this.onDidCreate.bind(this))
    );
  }
  public dispose() {
    this.fileWatchers?.forEach((watcher) => watcher.dispose());
    this.fileWatchers = [];
  }
}
