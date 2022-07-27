// import fs from "fs-extra";
import {
  GetAllFilesOpts,
  IFileStore,
  RespV3,
  URI,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
// import { getAllFiles } from "@dendronhq/common-server";

export class VSCodeFileStore implements IFileStore {
  /**
   * See {@link IFileStore.read}
   */
  async read(_uri: URI): Promise<RespV3<string>> {
    throw new Error("Not implemented");
    // try {
    //   const data = await fs.readFile(uri.fsPath, { encoding: "utf8" });
    //   return { data };
    // } catch (err) {
    //   return {
    //     error: DendronError.createFromStatus({
    //       status: ERROR_STATUS.CONTENT_NOT_FOUND,
    //       message: `Failed to read from ${uri.fsPath}.`,
    //       innerError: err as Error,
    //       severity: ERROR_SEVERITY.MINOR,
    //     }),
    //   };
    // }
  }

  /**
   * See {@link IFileStore.readDir}
   */
  async readDir(_opts: GetAllFilesOpts): Promise<RespV3<string[]>> {
    const res = await vscode.workspace.fs.readDirectory(_opts.root);

    return {
      data: res.map((item) => item[0]).filter((str) => str.endsWith(".md")),
    };
    // const { root } = _.defaults(opts, {
    //   exclude: [".git", "Icon\r", ".*"],
    // });
    // try {
    //   const resp = await getAllFiles(opts);
    //   if (resp.error) {
    //     return { error: resp.error };
    //   } else if (resp.data) {
    //     return { data: resp.data };
    //   } else {
    //     return { data: [] };
    //   }
    // } catch (err) {
    //   return {
    //     error: DendronError.createFromStatus({
    //       status: ERROR_STATUS.CONTENT_NOT_FOUND,
    //       message: `Failed to read from ${root}.`,
    //       innerError: err as Error,
    //       severity: ERROR_SEVERITY.MINOR,
    //     }),
    //   };
    // }
  }

  /**
   * See {@link IFileStore.write}
   */
  async write(_uri: URI, _content: string): Promise<RespV3<URI>> {
    throw new Error("Not implemented");
    // try {
    //   await fs.writeFile(uri.fsPath, content);
    //   return { data: uri };
    // } catch (err) {
    //   return {
    //     error: DendronError.createFromStatus({
    //       status: ERROR_STATUS.WRITE_FAILED,
    //       message: `Failed to write to ${uri.fsPath}.`,
    //       innerError: err as Error,
    //       severity: ERROR_SEVERITY.MINOR,
    //     }),
    //   };
    // }
  }

  /**
   * See {@link IFileStore.delete}
   */
  async delete(_uri: URI): Promise<RespV3<URI>> {
    throw new Error("Not implemented");
    // try {
    //   await fs.unlink(uri.fsPath);
    //   return { data: uri };
    // } catch (err) {
    //   return {
    //     error: DendronError.createFromStatus({
    //       status: ERROR_STATUS.DELETE_FAILED,
    //       message: `Failed to delete from ${uri.fsPath}.`,
    //       innerError: err as Error,
    //       severity: ERROR_SEVERITY.MINOR,
    //     }),
    //   };
    // }
  }

  /**
   * See {@link IFileStore.rename}
   */
  async rename(_oldUri: URI, _newUri: URI): Promise<RespV3<URI>> {
    throw new Error("Not implemented");
    // try {
    //   await fs.rename(oldUri.fsPath, newUri.fsPath);
    //   return { data: newUri };
    // } catch (err) {
    //   return {
    //     error: DendronError.createFromStatus({
    //       status: ERROR_STATUS.RENAME_FAILED,
    //       message: `Failed to rename from ${oldUri.fsPath} to ${newUri.fsPath}.`,
    //       innerError: err as Error,
    //       severity: ERROR_SEVERITY.MINOR,
    //     }),
    //   };
    // }
  }
}
