import * as vscode from "vscode";

import { getPlatform, resolveTilde, VSCodeUtils } from "./utils";

import { LookupController } from "./components/lookup/LookupController";
import { createLogger } from "@dendronhq/common-server";
import fs from "fs-extra";
import { getOrCreateEngine } from "@dendronhq/engine-server";
//import { getOrCreateEngine } from "@dendronhq/engine-server";
import path from "path";
import { DENDRON_WS_NAME } from "./constants";
import { DendronWorkspace } from "./workspace";

let L: any;

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
  writeWSFile(path.join(rootDir, DENDRON_WS_NAME), {
    rootDir,
  });
  VSCodeUtils.openWS(path.join(rootDir, DENDRON_WS_NAME));
}


async function changeWorkspace(rootDirRaw: string) {
  const ctx = "changeWorkspace";
  L.info({ ctx, rootDirRaw });
  const rootDir = resolveTilde(rootDirRaw);
  if (!fs.existsSync(rootDir)) {
    throw Error(`${rootDir} does not exist`);
  }
  if (!fs.existsSync(path.join(rootDir, DENDRON_WS_NAME))) {
    throw Error(`workspace file does not exist`);
  }
  VSCodeUtils.openWS(path.join(rootDir, DENDRON_WS_NAME));
}

async function getAndInitializeEngine(rootDir: string) {
  const engine = getOrCreateEngine({ root: rootDir, forceNew: true });
  // TODO: error check
  await engine.init();
  vscode.window.showInformationMessage("Dendron initialized");
}

// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const ctx = "activate";
  const { logPath, extensionPath, extensionUri, storagePath, globalStoragePath } = context;
  const ws = new DendronWorkspace(context);
  L = createLogger("extension");
  L.info({ ctx, logPath, extensionPath, extensionUri, storagePath, globalStoragePath });
  console.log("active", logPath);
  if (DendronWorkspace.isActive()) {
    L.info({ ctx, msg: "isActive" });
    const rootDir = ws.config.get("rootDir") as string;
    getAndInitializeEngine(rootDir);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("dendron.initWS", async () => {
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
      setupWorkspace(resp);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("dendron.changeWS", async () => {
      // // ~/Documents/Dendron
      const resp = await vscode.window.showInputBox({
        prompt: "Select your folder for dendron",
        ignoreFocusOut: true,
      });
      if (!resp) {
        L.error({ ctx, msg: "no input" });
        // TODO
        throw Error("must enter");
      }
      changeWorkspace(resp);
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
