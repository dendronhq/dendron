import * as assert from "assert";
import * as extension from "../../extension";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";

import { DendronFileSystemProvider } from "../../components/fsProvider";
import { beforeEach } from "mocha";
import { fstat } from "fs";
import path from "path";

class DevWorkspaceUtils {
  static getRootDir() {
    // TODO: go up until you find lerna.json
    return path.join(__dirname, "../../../../../");
  }
  static getFixturesDir() {
    return path.join(this.getRootDir(), "fixtures");
  }
}

async function setup() {
  const fixtures = DevWorkspaceUtils.getFixturesDir();
  const storeDir = path.join(fixtures, "store");
  console.log(storeDir);
  const fsp = await DendronFileSystemProvider.getOrCreate({ root: storeDir });
  vscode.workspace.registerFileSystemProvider("denfs", fsp, {
    isCaseSensitive: true,
  });
  vscode.workspace.updateWorkspaceFolders(0, 0, {
    uri: vscode.Uri.parse("denfs:/"),
    name: "Dendron",
  });
  return { fsp };
}

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");
  let fsp: DendronFileSystemProvider;

  beforeEach(async () => {
    ({ fsp } = await setup());
  });

  test("real test", () => {
    console.log("done");
    const root = fsp.root;
    assert.equal(1, 1);
  });
});
