import { DNode } from "@dendronhq/common-all";
import path from "path";
import { Uri, workspace, WorkspaceFolder } from "vscode";

export function node2Uri(node: DNode, workspaceFolders: WorkspaceFolder[]): Uri {
  const ext = node.type === "note" ? ".md" : ".yml";
  const nodePath = node.fname + ext;
  const rootWs = workspaceFolders[0];
  const rootPath = rootWs.uri.path;
  return Uri.file(path.join(rootPath, nodePath));
}
