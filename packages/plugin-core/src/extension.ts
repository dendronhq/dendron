import { getAndInitializeEngine } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { DendronWorkspace } from "./workspace";

// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const ctx = "activate";
  const { logPath, extensionPath, extensionUri, storagePath, globalStoragePath } = context;
  const ws = new DendronWorkspace(context);
  ws.L.info({ ctx, logPath, extensionPath, extensionUri, storagePath, globalStoragePath });
  console.log("active", logPath, extensionPath);
  if (DendronWorkspace.isActive()) {
    ws.L.info({ ctx, msg: "isActive" });
    const rootDir = ws.config.get("rootDir") as string;
    getAndInitializeEngine(rootDir);
  }
}

// this method is called when your extension is deactivated
export function deactivate() {
  const ctx = "deactivate";
  DendronWorkspace.instance().L.info({ ctx });
}
