import { RespV3 } from "../types";

export type GetAllFilesOpts = {
  root: string;
  include?: string[];
  exclude?: string[];
};

/**
 * Interface responsible for interacting with filesystem
 */
export interface IFileStore {
  /**
   * Reads contents of file at given path.
   * If file for given path is not found, return error.
   *
   * @param fpath: full path to target file
   * @return string representation of contents
   */
  read(fpath: string): Promise<RespV3<string>>;

  /**
   * Reads entries of file directory stored at given path.
   * If file directory for given key is not found, return error.
   *
   * @param opts: opts containing directory name and file types to include/exlude
   * @return Array of file names
   */
  readDir(opts: GetAllFilesOpts): Promise<RespV3<string[]>>;

  /**
   * Write contents to filesystem, overwriting contents at given path.
   *
   * @param fpath: full path to target file to write to
   * @param content: content to write to filesystem
   * @return original fpath
   */
  write(fpath: string, content: string): Promise<RespV3<string>>;

  /**
   * Deletes entries from given path
   * If path does not exist, do nothing.
   *
   * @return original fpath
   */
  delete(fpath: string): Promise<RespV3<string>>;

  /**
   * Renames file or folder
   * If path does not exist, do nothing.
   *
   * @return new fpath
   */
  rename(oldFpath: string, newFpath: string): Promise<RespV3<string>>;
}
