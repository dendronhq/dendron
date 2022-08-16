import {
  DendronError,
  ERROR_SEVERITY,
  ERROR_STATUS,
  GetAllFilesOpts,
  globMatch,
  IFileStore,
  isNotNull,
  RespV2,
  RespV3,
  URI,
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";

export class VSCodeFileStore implements IFileStore {
  async read(uri: URI): Promise<RespV3<string>> {
    try {
      const raw = await vscode.workspace.fs.readFile(uri);
      // @ts-ignore - this needs to use browser's TextDecoder, not an import from node utils
      const textDecoder = new TextDecoder();
      const data = textDecoder.decode(raw);
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
  async write(uri: URI, content: string): Promise<RespV3<URI>> {
    try {
      await vscode.workspace.fs.writeFile(
        uri,
        new Uint8Array(Buffer.from(content, "utf-8"))
      );
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
  async delete(uri: URI): Promise<RespV3<URI>> {
    try {
      await vscode.workspace.fs.delete(uri);
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
  async rename(oldUri: URI, newUri: URI): Promise<RespV3<URI>> {
    try {
      await vscode.workspace.fs.rename(oldUri, newUri);
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

/** Gets all files in `root`, with include and exclude lists (glob matched)
 * Implemented this function again here from common-server.
 */
export async function getAllFiles(
  opts: GetAllFilesOpts
): Promise<RespV2<string[]>> {
  const out = await getAllFilesWithTypes(opts);
  const data = out.data?.map((item) => item[0]);
  return { error: out.error, data };
}

export async function getAllFilesWithTypes(opts: GetAllFilesOpts) {
  const { root } = _.defaults(opts, {
    exclude: [".git", "Icon\r", ".*"],
  });
  try {
    const rootUri = root;
    const allFiles = await vscode.workspace.fs.readDirectory(rootUri);
    return {
      data: allFiles
        .map((values) => {
          // match exclusions
          const fname = values[0];
          const fileType = values[1];
          if (
            _.some([
              fileType === vscode.FileType.Directory,
              globMatch(opts.exclude || [], fname),
            ])
          ) {
            return null;
          }
          // match inclusion
          if (opts.include && !globMatch(opts.include, fname)) {
            return null;
          }
          return values;
        })
        .filter(isNotNull),
      error: null,
    };
  } catch (err) {
    return {
      error: new DendronError({
        message: "Error when reading the vault",
        payload: err,
        // Marked as minor to avoid stopping initialization. Even if we can't
        // read one vault, we might be able to read other vaults.
        severity: ERROR_SEVERITY.MINOR,
      }),
    };
  }
}
