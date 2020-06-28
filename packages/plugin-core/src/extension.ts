import * as vscode from "vscode";

import { LookupController } from "./components/lookup/LookupController";
import { createLogger } from "@dendronhq/common-server";
import fs from "fs-extra";
import { getStage } from "@dendronhq/common-all";
//import { getOrCreateEngine } from "@dendronhq/engine-server";
import path from "path";
import { resolveTilde } from "./utils";

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

async function setupWorkspace(
  rootDirRaw: string,
  _config: vscode.WorkspaceConfiguration
) {
  const rootDir = resolveTilde(rootDirRaw);
  const notesDir: string = path.join(rootDir, "notes");
  [rootDir, notesDir].forEach((dirPath: string) => {
    fs.ensureDirSync(dirPath);
  });
  // TODO: hardcoded
  const dotVscodeDefault =
    "/Users/kevinlin/projects/dendronv2/dendron/packages/plugin-core/assets/.vscode";
  fs.copySync(dotVscodeDefault, path.join(rootDir, ".vscode"));
  writeWSFile(path.join(rootDir, "dendron.code-workspace"), { rootDir });
  //fs.copySync(codeWsFile, path.join(rootDir, "default.code-workspace"));
  vscode.commands.executeCommand(
    "vscode.openFolder",
    vscode.Uri.parse(path.join(rootDir, "dendron.code-workspace"))
  );
  // vscode.workspace.updateWorkspaceFolders(0, 0, {

  //   uri: vscode.Uri.parse(
  //     path.join(rootDir, ".vscode", "default.code-workspace")
  //   ),
  //   name: "Dendron",
  // });
}

// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log("activate");
  const ctx = "activate";

  if (getStage() !== "test") {
    //const root = env("DENDRON_FS_ROOT");
    const config = vscode.workspace.getConfiguration("dendron");
    // TODO
    if (!config.get("rootDir")) {
      L.info({ ctx, status: "no rootDir" });
      setupWorkspace("~/Documents/Dendron", config);
      // const platform = getPlatform();
      // let rootDirDefault = "";
      // if (platform === "darwin") {
      //   rootDirDefault = "~/Documents/Dendron";
      // }
      // console.log({ platform });
      // // ~/Documents/Dendron
      // vscode.window
      //   .showInputBox({
      //     value: rootDirDefault,
      //     prompt: "Select your default folder for dendron",
      //     ignoreFocusOut: true,
      //   })
      //   .then(async (resp) => {
      //     if (!resp) {
      //       // TODO
      //       throw Error("must enter");
      //     }
      //     // TODO: setup workspace
      //   });
    }
    L.info({ ctx, status: "rootDir exist" });

    /*
    vscode.workspace.updateWorkspaceFolders(0, 0, {
      uri: vscode.Uri.parse(root),
      name: "Dendron",
    });
    const engine = getOrCreateEngine({ root, mode: "exact" });
    engine.init().then(() => {
      console.log("engine initialized");
    });
    */
  }

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("dendron.helloWorld", () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage("Hello World from dendron!");
  });

  let dendronLookupDisposable = vscode.commands.registerCommand(
    "dendron.lookup",
    async () => {
      const ctx = "registerCommand";
      vscode.window.showInformationMessage("BOND!");
      L.info({ ctx: ctx + ":LookupController:pre" });
      const controller = new LookupController();
      L.info({ ctx: ctx + ":LookupController:post" });
      controller.show();
    }
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

  context.subscriptions.push(disposable);
  context.subscriptions.push(dendronLookupDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
  console.log("deactivate");
}
