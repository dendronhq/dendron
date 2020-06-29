import * as vscode from "vscode";

import { getPlatform, resolveTilde } from "./utils";

import { LookupController } from "./components/lookup/LookupController";
import { createLogger } from "@dendronhq/common-server";
import fs from "fs-extra";
import { getOrCreateEngine } from "@dendronhq/engine-server";
//import { getOrCreateEngine } from "@dendronhq/engine-server";
import path from "path";

const L = createLogger("extension");

class DendronWorkspace {
  static isActive(): boolean {
    const conf = vscode.workspace.getConfiguration("dendron").get("rootDir");
    if (conf) {
      return true;
    } else {
      return false;
    }
  }
}

// --- VSCode

function writeWSFile(fpath: string, opts: { rootDir: string }) {
  const jsonBody = {
    folders: [
      {
        path: opts.rootDir,
      },
    ],
    settings: {
      "spellright.language": ["en"],
      "spellright.documentTypes": ["markdown", "latex", "plaintext"],
      "editor.minimap.enabled": false,
      "dendron.rootDir": opts.rootDir,
    },
  };
  fs.writeJsonSync(fpath, jsonBody);
}

async function setupWorkspace(rootDirRaw: string) {
  const ctx = "setupWorkspace";
  L.info({ ctx, rootDirRaw });
  const rootDir = resolveTilde(rootDirRaw);
  // TODO: prompt for confirmation
  fs.removeSync(rootDir);
  [rootDir].forEach((dirPath: string) => {
    fs.ensureDirSync(dirPath);
  });
  // TODO: hardcoded
  const assetsDir =
    "/Users/kevinlin/projects/dendronv2/dendron/packages/plugin-core/assets";
  const dotVscodeDefault =
    "/Users/kevinlin/projects/dendronv2/dendron/packages/plugin-core/assets/.vscode";
  fs.copySync(dotVscodeDefault, path.join(rootDir, ".vscode"));
  fs.copySync(path.join(assetsDir, "notes"), rootDir);
  writeWSFile(path.join(rootDir, ".vscode", "dendron.code-workspace"), {
    rootDir,
  });
  vscode.commands
    .executeCommand(
      "vscode.openFolder",
      vscode.Uri.parse(path.join(rootDir, ".vscode", "dendron.code-workspace"))
    )
    .then(async () => {
      const engine = getOrCreateEngine({ root: rootDir, forceNew: true });
      // TODO: error check
      await engine.init();
      vscode.window.showInformationMessage("Dendron initialized");
      L.info({ ctx: ctx + ":exit" });
    });
}

// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const ctx = "activate";
  const { logPath, extensionPath, extensionUri, storagePath, globalStoragePath } = context;
  L.info({ ctx, logPath, extensionPath, extensionUri, storagePath, globalStoragePath });
  if (DendronWorkspace.isActive()) {
    L.info({ ctx, msg: "isActive" });
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("dendron.init", async () => {
      let rootDirDefault = "";
      const platform = getPlatform();
      if (platform === "darwin") {
        rootDirDefault = "~/Documents/Dendron";
      }
      // // ~/Documents/Dendron
      const resp = await vscode.window.showInputBox({
        value: rootDirDefault,
        prompt: "Select your default folder for dendron",
        ignoreFocusOut: true,
      });
      if (!resp) {
        L.error({ ctx, msg: "no input" });
        // TODO
        throw Error("must enter");
      }
      // TODO: setup workspace
      setupWorkspace(resp);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("dendron.lookup", async () => {
      const ctx = "registerCommand";
      L.info({ ctx: ctx + ":LookupController:pre" });
      const controller = new LookupController();
      L.info({ ctx: ctx + ":LookupController:post" });
      controller.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("dendron.workspaceInit", () => {
      vscode.window.showInformationMessage("Init workspace");
      vscode.workspace.updateWorkspaceFolders(0, 0, {
        uri: vscode.Uri.parse("denfs:/"),
        name: "Dendron",
      });
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {
  const ctx = "deactivate";
  L.info({ ctx });
}
