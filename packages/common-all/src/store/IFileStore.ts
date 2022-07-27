import { URI } from "vscode-uri";
import { RespV3 } from "../types";

export type GetAllFilesOpts = {
  root: URI;
  include?: string[];
  exclude?: string[];
};

/**
 * Interface responsible for interacting with filesystem
 */
export interface IFileStore {
  /**
   * Reads contents of file at given URI.
   * If file for given path is not found, return error.
   *
   * @param uri: URI of target file
   * @return string representation of contents
   */
  read(uri: URI): Promise<RespV3<string>>;

  /**
   * Reads entries of file directory stored at given path.
   * If file directory for given key is not found, return error.
   *
   * @param opts: opts containing directory name and file types to include/exlude
   * @return Array of file names
   */
  readDir(opts: GetAllFilesOpts): Promise<RespV3<string[]>>;

  /**
   * Write contents to filesystem, overwriting contents at given URI.
   *
   * @param uri: URI to target file to write to
   * @param content: content to write to filesystem
   * @return original URI
   */
  write(uri: URI, content: string): Promise<RespV3<URI>>;

  /**
   * Deletes entries from given URI
   * If URI does not exist, do nothing.
   *
   * @return original URI
   */
  delete(uri: URI): Promise<RespV3<URI>>;

  /**
   * Renames file or folder
   * If URI does not exist, do nothing.
   *
   * @return new URI
   */
  rename(oldUri: URI, newUri: URI): Promise<RespV3<URI>>;
}
