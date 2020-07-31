import { DNode } from "@dendronhq/common-all";
import path from "path";
import { Uri, workspace } from "vscode";

export function node2Uri(node: DNode): Uri {
  const ext = node.type === "note" ? ".md" : ".yml";
  const nodePath = node.fname + ext;
  if (!workspace.workspaceFolders) {
    // TODO: handle
    throw Error("ws not initialized");
  }
  const rootWs = workspace.workspaceFolders[0];
  const rootPath = rootWs.uri.path;
  return Uri.file(path.join(rootPath, nodePath));
}
