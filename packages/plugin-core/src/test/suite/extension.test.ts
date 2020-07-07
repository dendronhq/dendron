import { NoteRawProps, testUtils } from "@dendronhq/common-all";
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

function createMockContext(): vscode.ExtensionContext {
  const pkgRoot = FileTestUtils.getPkgRoot(__dirname);
  return {
    subscriptions: [],
    extensionPath: pkgRoot,
    globalState: {
      get: (_key: string) => {
        return undefined;
      },
      update: (_key: string, _value: any) => {},
    },
  } as any;
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

suite("Extension Test Suite", function(){
  vscode.window.showInformationMessage("Start all tests.");
  let root: string;
  let actualFiles: string[];
  let expectedFiles: string[];
  let ws: DendronWorkspace;
  this.timeout(5000); 


  //(this: Context, done: Done)
  beforeEach(async function(){
    const ctx = createMockContext();
    ws = new DendronWorkspace(ctx, { skipSetup: true });
    root = FileTestUtils.tmpDir("/tmp/dendron", true);
    await ws.setupWorkspace(root, { skipOpenWS: true });
    const fixtures = LernaTestUtils.getFixturesDir();
    const storeDir = path.join(fixtures, "store");
    console.log(storeDir);
    fs.copySync(storeDir, root);
    console.log(root);
    return
  });

  afterEach(async () => {
    assert.deepEqual(actualFiles, expectedFiles);
    fs.removeSync(root);
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
      const { content, data } = FileTestUtils.readMDFile(root, "foo.one.md");
      assert.equal(_.trim(content), "");
      const actual = testUtils.omitEntropicProps(data as NoteRawProps, true);
      assert.deepEqual(actual, {
        custom: {
          bond: 42,
        },
        id: "foo.one",
        title: "foo.one",
      });
      // stub node should not be written to disk
      [expectedFiles, actualFiles] = VSFileUtils.cmpFiles(
        root,
        LernaTestUtils.fixtureFilesForStore()
      );
    });
  });
});
