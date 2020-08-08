import { Uri } from 'vscode';

export type WorkspaceCache = {
    imageUris: Uri[];
    markdownUris: Uri[];
    otherUris: Uri[];
    allUris: Uri[];
    danglingRefs: string[];
    danglingRefsByFsPath: { [key: string]: string[] };
  };

export type RefT = {
  label: string;
  ref: string;
};
