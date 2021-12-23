import { DNoteAnchorBasic, DVault, NoteProps } from "@dendronhq/common-all";
import { Position, ViewColumn } from "vscode";

export enum TargetKind {
  NOTE = "note",
  NON_NOTE = "nonNote",
}

export type GoToNoteCommandOpts = {
  qs?: string;
  vault?: DVault;
  anchor?: DNoteAnchorBasic;
  overrides?: Partial<NoteProps>;
  kind?: TargetKind;
  /**
   * What {@link vscode.ViewColumn} to open note in
   */
  column?: ViewColumn;
  /** added for contextual UI analytics. */
  source?: string;
};
export { GoToNoteCommandOpts as GotoNoteCommandOpts };

export type GoToNoteCommandOutput =
  // When opening a note
  | { kind: TargetKind.NOTE; note: NoteProps; pos?: Position; source?: string }
  // When opening a non-note file
  | { kind: TargetKind.NON_NOTE; fullPath: string }
  | undefined;
