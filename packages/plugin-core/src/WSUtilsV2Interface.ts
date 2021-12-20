import vscode from "vscode";
import { NoteProps } from "@dendronhq/common-all";

export interface IWSUtilsV2 {
  getNoteFromDocument(document: vscode.TextDocument): undefined | NoteProps;

  getVaultFromDocument(document: vscode.TextDocument): unknown;

  tryGetNoteFromDocument(document: vscode.TextDocument): NoteProps | undefined;

  getActiveNote(): any;
}
