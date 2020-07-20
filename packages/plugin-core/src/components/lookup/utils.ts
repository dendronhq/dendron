import { DNode } from "@dendronhq/common-all";
import path from "path";
import { Uri, workspace } from "vscode";

export function node2Uri(node: DNode): Uri {
  const nodePath = node.fname + ".md";
  if (!workspace.workspaceFolders) {
    // TODO: handle
    throw Error("ws not initialized");
  }
  const rootWs = workspace.workspaceFolders[0];
  const rootPath = rootWs.uri.path;
  return Uri.file(path.join(rootPath, nodePath));
}
