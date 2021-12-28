import vscode from "vscode";
import { DVault, NoteProps } from "@dendronhq/common-all";

export interface IWSUtilsV2 {
  getNoteFromDocument(document: vscode.TextDocument): undefined | NoteProps;

  getVaultFromDocument(document: vscode.TextDocument): DVault;

  tryGetNoteFromDocument(document: vscode.TextDocument): NoteProps | undefined;

  getActiveNote(): NoteProps | undefined;
}
