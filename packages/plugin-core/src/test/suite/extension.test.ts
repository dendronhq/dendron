import { FileTestUtils, LernaTestUtils } from "@dendronhq/common-server";
import * as assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, beforeEach, describe } from "mocha";
// import { DendronFileSystemProvider } from "../../components/fsProvider";
// import _ from "lodash";
// import { fnameToUri } from "../../components/lookup/utils";
// import fs from "fs-extra";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { DendronWorkspace } from "../../workspace";
import { testUtils, NoteRawProps } from "@dendronhq/common-all";

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
  let ws: DendronWorkspace;

  beforeEach(async () => {
    const ctx = createMockContext();
    ws = new DendronWorkspace(ctx, { skipSetup: true });
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

  describe("workspace", () => {
    test("reload", async () => {
      await ws.reloadWorkspace(root);
      assert.equal(ws.engine.notes["root"].children.length, 1);
      console.log("bond", root);
      const { content, data } = FileTestUtils.readMDFile(root, "foo.one.md");
      assert.equal(_.trim(content), "");
      assert.deepEqual(testUtils.omitEntropicProps(data as NoteRawProps), {
        custom: {
          bond: 42,
        },
        data: {
          schemaId: "foo",
        },
        desc: "",
        fname: "foo.one",
        path: "foo.one",
        title: "foo.one",
      });
    });
  });
});
