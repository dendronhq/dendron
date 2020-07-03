import * as assert from "assert";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";

import { afterEach, before, beforeEach, describe } from "mocha";

// import { DendronFileSystemProvider } from "../../components/fsProvider";
// import _ from "lodash";
// import { fnameToUri } from "../../components/lookup/utils";
// import fs from "fs-extra";
import path from "path";
import { FileTestUtils } from "@dendronhq/common-server";
import { DendronWorkspace } from "../../workspace";
import fs from "fs-extra";
import { LernaTestUtils } from "@dendronhq/common-server";
import _ from "lodash";

function createMockContext(): vscode.ExtensionContext {
  const pkgRoot = FileTestUtils.getPkgRoot(__dirname);
  return { subscriptions: [], extensionPath: pkgRoot } as any;
}

class VSFileUtils {
  static cmpFiles = (
    root: string,
    expected: string[],
    opts?: { add?: string[]; remove?: string[] }
  ) => {
    const cleanOpts: Required<{
      add?: string[];
      remove?: string[];
    }> = _.defaults(opts || {}, {
      add: [],
      remove: [],
      ignore: [".DS_Store", ".vscode", "dendron.code-workspace", "vault.main"],
    });
    return FileTestUtils.cmpFiles(root, expected, cleanOpts);
  };
}

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");
  let root: string;
  let actualFiles: string[];
  let expectedFiles: string[];

  beforeEach(async () => {
    const ctx = createMockContext();
    const ws = new DendronWorkspace(ctx, { skipSetup: true });
    root = FileTestUtils.tmpDir("/tmp/dendron");
    await ws.setupWorkspace(root, { skipOpenWS: true });
    const fixtures = LernaTestUtils.getFixturesDir();
    const storeDir = path.join(fixtures, "store");
    console.log(storeDir);
    fs.copySync(storeDir, root);
    console.log(root);
  });

  afterEach(async () => {
    assert.deepEqual(actualFiles, expectedFiles);
    fs.removeSync(root);
  });

  describe("Lookup", () => {
    test("sanity", async () => {
      assert.ok(true);
    });
  });

  describe("file system", () => {
    test("new file", () => {
      assert.ok(true);
      [expectedFiles, actualFiles] = VSFileUtils.cmpFiles(
        root,
        LernaTestUtils.fixtureFilesForStore()
      );
    });
  });

  //   describe("DendronFileSystemProvider", () => {
  //     beforeEach(async () => {
  //       ({ fsp, testRoot } = await setup());
  //     });
  //     afterEach(() => {
  //       fs.removeSync(testRoot);
  //     });

  //     describe("create new", () => {
  //       describe("parent: root", () => {
  //         test("child: root/domain", async () => {
  //           const uri = await fnameToUri("baz", { checkIfDirectoryFile: false });
  //           await fsp.writeFile(uri, Buffer.from("baz.body"), {
  //             create: true,
  //             overwrite: true,
  //             writeToEngine: true,
  //           });
  //           const note = _.find(fsp.engine.notes, { fname: "baz" });
  //           checkFiles(assert, testRoot, { additions: ["baz"] });
  //           assert.ok(!_.isUndefined(note));
  //         });

  //         test("grandchild, node: root/domain/node", async () => {
  //           const fname = "foo.three";
  //           const uri = await fnameToUri(fname, { checkIfDirectoryFile: false });
  //           await fsp.writeFile(uri, Buffer.from(`${fname}.body`), {
  //             create: true,
  //             overwrite: true,
  //             writeToEngine: true,
  //           });
  //           checkFiles(assert, testRoot, { additions: [fname] });
  //         });

  //         test("grandchild, stub: root/stub/node", async () => {
  //           const fname = "baz.one";
  //           const uri = await fnameToUri(fname, { checkIfDirectoryFile: false });
  //           await fsp.writeFile(uri, Buffer.from(`${fname}.body`), {
  //             create: true,
  //             overwrite: true,
  //             writeToEngine: true,
  //           });
  //           checkFiles(assert, testRoot, { additions: [fname] });
  //         });
  //       });

  //       describe("parent: domain", () => {
  //         test("child: domain/node", async () => {
  //           await checkSingleAddition(assert, fsp, testRoot, "foo.three");
  //         });

  //         test("grandchild, stub: domain/stub/node", async () => {
  //           await checkSingleAddition(assert, fsp, testRoot, "foo.beta.one");
  //         });

  //         test("grandchild, node: domain/node/node", async () => {
  //           await checkSingleAddition(assert, fsp, testRoot, "foo.alpha.three");
  //         });
  //       });

  //       describe.only("edge", () => {
  //         test("(grandchild,stub), (child, node)", async () => {
  //           await checkSingleAddition(assert, fsp, testRoot, "foo.beta.one");
  //           await checkSingleAddition(assert, fsp, testRoot, "foo.beta");
  //         });
  //       });
  //     });
  //   });
});
