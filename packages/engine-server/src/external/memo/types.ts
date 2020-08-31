import { URI } from "vscode-uri";

export type WorkspaceCache = {
  imageUris: URI[];
  markdownUris: URI[];
  otherUris: URI[];
  allUris: URI[];
  danglingRefs: string[];
  danglingRefsByFsPath: { [key: string]: string[] };
};

export type RefT = {
  label: string;
  ref: string;
};
