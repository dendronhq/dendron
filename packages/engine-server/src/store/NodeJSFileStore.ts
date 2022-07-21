import fs from "fs-extra";
import {
  DendronError,
  ERROR_SEVERITY,
  ERROR_STATUS,
  GetAllFilesOpts,
  IFileStore,
  RespV3,
  URI,
} from "@dendronhq/common-all";
import _ from "lodash";
import { getAllFiles } from "@dendronhq/common-server";

export class NodeJSFileStore implements IFileStore {
  /**
   * See {@link IFileStore.read}
   */
  async read(uri: URI): Promise<RespV3<string>> {
    try {
      const data = await fs.readFile(uri.fsPath, { encoding: "utf8" });
      return { data };
    } catch (err) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CONTENT_NOT_FOUND,
          message: `Failed to read from ${uri.fsPath}.`,
          innerError: err as Error,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  /**
   * See {@link IFileStore.readDir}
   */
  async readDir(opts: GetAllFilesOpts): Promise<RespV3<string[]>> {
    const { root } = _.defaults(opts, {
      exclude: [".git", "Icon\r", ".*"],
    });
    try {
      const resp = await getAllFiles(opts);
      if (resp.error) {
        return { error: resp.error };
      } else if (resp.data) {
        return { data: resp.data };
      } else {
        return { data: [] };
      }
    } catch (err) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CONTENT_NOT_FOUND,
          message: `Failed to read from ${root}.`,
          innerError: err as Error,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  /**
   * See {@link IFileStore.write}
   */
  async write(uri: URI, content: string): Promise<RespV3<URI>> {
    try {
      await fs.writeFile(uri.fsPath, content);
      return { data: uri };
    } catch (err) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.WRITE_FAILED,
          message: `Failed to write to ${uri.fsPath}.`,
          innerError: err as Error,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  /**
   * See {@link IFileStore.delete}
   */
  async delete(uri: URI): Promise<RespV3<URI>> {
    try {
      if (await fs.pathExists(uri.fsPath)) {
        await fs.unlink(uri.fsPath);
      }
      return { data: uri };
    } catch (err) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.DELETE_FAILED,
          message: `Failed to delete from ${uri.fsPath}.`,
          innerError: err as Error,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  /**
   * See {@link IFileStore.rename}
   */
  async rename(oldUri: URI, newUri: URI): Promise<RespV3<URI>> {
    try {
      await fs.rename(oldUri.fsPath, newUri.fsPath);
      return { data: newUri };
    } catch (err) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.RENAME_FAILED,
          message: `Failed to rename from ${oldUri.fsPath} to ${newUri.fsPath}.`,
          innerError: err as Error,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }
}
