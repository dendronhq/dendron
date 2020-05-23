import { files } from "dropbox";

export type MetadataReference =
  | files.FileMetadataReference
  | files.FolderMetadataReference;

export interface ListFolderResultSimple {
  /**
   * The files and (direct) subfolders in the folder.
   */
  entries: Array<MetadataReference>;
  /**
   * Pass the cursor into listFolderContinue() to see what's changed in the
   * folder since your previous query.
   */
  cursor: files.ListFolderCursor;
  /**
   * If true, then there are more entries available. Pass the cursor to
   * listFolderContinue() to retrieve the rest.
   */
  has_more: boolean;
}
