import { WorkspaceFolder } from "vscode";

export type WorkspaceSettings = {
  folders: WorkspaceFolder[];
  settings: any;
  extensions: any;
};
