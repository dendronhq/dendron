import * as vscode from "vscode";

import { getPlatform, resolveTilde } from "./utils";

import { LookupController } from "./components/lookup/LookupController";
import { createLogger } from "@dendronhq/common-server";
import fs from "fs-extra";
import { getStage } from "@dendronhq/common-all";
//import { getOrCreateEngine } from "@dendronhq/engine-server";
import path from "path";

const L = createLogger("extension");

// --- VSCode

function writeWSFile(fpath: string, opts: { rootDir: string }) {
  const jsonBody = {
    folders: [
      {
        path: "notes",
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
  const notesDir: string = path.join(rootDir, "notes");
  [rootDir, notesDir].forEach((dirPath: string) => {
    fs.ensureDirSync(dirPath);
  });
  // TODO: hardcoded
  const dotVscodeDefault =
    "/Users/kevinlin/projects/dendronv2/dendron/packages/plugin-core/assets/.vscode";
  fs.copySync(dotVscodeDefault, path.join(rootDir, ".vscode"));
  writeWSFile(path.join(rootDir, "dendron.code-workspace"), { rootDir });
  vscode.commands.executeCommand(
    "vscode.openFolder",
    vscode.Uri.parse(path.join(rootDir, "dendron.code-workspace"))
  );
  vscode.window.showInformationMessage("Dendron initialized");
  L.info({ ctx: ctx + ":exit" });
}

// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const ctx = "activate";
  L.info({ ctx });

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
