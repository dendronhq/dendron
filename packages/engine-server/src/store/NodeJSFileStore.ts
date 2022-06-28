import fs from "fs-extra";
import {
  DendronError,
  ERROR_SEVERITY,
  ERROR_STATUS,
  GetAllFilesOpts,
  IFileStore,
  RespV3,
} from "@dendronhq/common-all";
import _ from "lodash";
import { getAllFiles } from "@dendronhq/common-server";

export class NodeJSFileStore implements IFileStore {
  /**
   * See {@link IFileStore.read}
   */
  async read(fpath: string): Promise<RespV3<string>> {
    try {
      const data = await fs.readFile(fpath, { encoding: "utf8" });
      return { data };
    } catch (err) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CONTENT_NOT_FOUND,
          message: `Failed to read from ${fpath}.`,
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
  async write(fpath: string, content: string): Promise<RespV3<string>> {
    try {
      await fs.writeFile(fpath, content);
      return { data: fpath };
    } catch (err) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.WRITE_FAILED,
          message: `Failed to write to ${fpath}.`,
          innerError: err as Error,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  /**
   * See {@link IFileStore.delete}
   */
  async delete(fpath: string): Promise<RespV3<string>> {
    try {
      await fs.unlink(fpath);
      return { data: fpath };
    } catch (err) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.DELETE_FAILED,
          message: `Failed to delete from ${fpath}.`,
          innerError: err as Error,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  /**
   * See {@link IFileStore.rename}
   */
  async rename(oldFpath: string, newFpath: string): Promise<RespV3<string>> {
    try {
      await fs.rename(oldFpath, newFpath);
      return { data: newFpath };
    } catch (err) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.RENAME_FAILED,
          message: `Failed to rename from ${oldFpath} to ${newFpath}.`,
          innerError: err as Error,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }
}
