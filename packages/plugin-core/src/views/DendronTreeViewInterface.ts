import vscode, { TextEditor, TreeView, Uri } from "vscode";
import { NoteProps, NotePropsDict } from "@dendronhq/common-all";
import { Logger } from "../logger";

export interface ITreeNote {
  id: string;
  note: NoteProps;
  uri: Uri;
  children: string[];
  L: typeof Logger;
}

export interface IEngineNoteProvider {
  refresh(): void;

  sort(notes: ITreeNote[]): ITreeNote[];

  sortChildren(children: string[], noteDict: NotePropsDict): unknown[];

  getTreeItem(id: string): vscode.TreeItem;

  getChildren(id?: string): Promise<unknown>;

  getParent(id: string): Promise<string | null>;

  parseTree(note: NoteProps, ndict: NotePropsDict): Promise<ITreeNote>;
}

export interface IDendronTreeView {
  pause?: boolean;
  treeView: TreeView<string>;
  treeProvider: IEngineNoteProvider;

  onOpenTextDocument(editor: TextEditor | undefined): Promise<void>;
}
