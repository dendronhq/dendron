import { Uri, workspace } from "vscode";

import { DNode } from "@dendronhq/common-all/src";
import path from "path";

export function node2Uri(node: DNode): Uri {
  const nodePath = node.fname + ".md";
  if (!workspace.workspaceFolders) {
    // TODO: handle
    throw Error("ws not initialized");
  }
  const rootWs = workspace.workspaceFolders[0];
  const rootPath = rootWs.uri.path;
  const uri = Uri.parse(path.join(rootPath, nodePath));
  return uri;
}
