import { Uri, workspace } from "vscode";

import { DNode, DNodeUtils } from "@dendronhq/common-all";

export function node2Uri(node: DNode): Uri {
  if (!workspace.workspaceFolders) {
    // TODO: handle
    throw Error("ws not initialized");
  }
  const rootWs = workspace.workspaceFolders[0];
  const rootPath = rootWs.uri.path;
  return DNodeUtils.node2Uri(node, rootPath);
}
