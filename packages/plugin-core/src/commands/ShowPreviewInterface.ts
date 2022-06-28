import { NoteProps } from "@dendronhq/common-all";
import { Uri } from "vscode";

export type TogglePreviewCommandOpts = Uri;
/** `note` if a note that's in the engine was opened. `fsPath' if a non-note file was opened. `undefined` if nothing was found to preview.
 *
 */
export type TogglePreviewCommandOutput =
  | { note: NoteProps; fsPath?: string }
  | { note?: NoteProps; fsPath: string }
  | undefined;
