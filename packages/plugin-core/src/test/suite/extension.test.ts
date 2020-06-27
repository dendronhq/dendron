import * as assert from "assert";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";

import { beforeEach, describe } from "mocha";

import { DendronFileSystemProvider } from "../../components/fsProvider";
import _ from "lodash";
import { fnameToUri } from "../../components/lookup/utils";
import path from "path";
import { testUtils } from "@dendronhq/common-server";

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
  const testRoot = testUtils.setupTmpDendronDir({
    fixturesDir: storeDir,
    tmpDir: "/tmp/dendron/plugin-core",
  });
  const fsp = await DendronFileSystemProvider.getOrCreate({ root: testRoot });
  vscode.workspace.registerFileSystemProvider("denfs", fsp, {
    isCaseSensitive: true,
  });
  vscode.workspace.updateWorkspaceFolders(0, 0, {
    uri: vscode.Uri.parse("denfs:/"),
    name: "Dendron",
  });
  console.log({ testRoot });
  return { fsp, testRoot };
}

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  describe("DendronFileSystemProvider", () => {
    let fsp: DendronFileSystemProvider;
    beforeEach(async () => {
      ({ fsp } = await setup());
    });

    describe("create new", () => {
      describe("parent: root", () => {
        test("child", async () => {
          const uri = await fnameToUri("baz", { checkIfDirectoryFile: false });
          await fsp.writeFile(uri, Buffer.from("baz.body"), {
            create: true,
            overwrite: true,
            writeToEngine: true,
          });
          const note = _.find(fsp.engine.notes, { fname: "baz" });
          assert.ok(!_.isUndefined(note));
          //testUtils.expectSnapshot(expect, "main", _.values(fsp.engine.notes));
        });
      });
    });
  });
});
