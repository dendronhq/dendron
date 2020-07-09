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
import { Settings } from "../../settings";
import { DendronWorkspace } from "../../workspace";
import { VSCodeUtils } from "../../utils";

function createMockConfig(settings: any): vscode.WorkspaceConfiguration {
  const _settings = settings;
  return {
    get: (_key: string) => {
      return _settings[_key];
    },
    update: async (_key: string, _value: any) => {
      _settings[_key] = _value;
    },
    has: (key: string) => {
      return key in _settings;
    },
    inspect: (_section: string) => {
      return _settings;
    },
  };
}

function createMockContext(root: string): vscode.ExtensionContext {
  const pkgRoot = FileTestUtils.getPkgRoot(__dirname);
  return {
    subscriptions: [],
    extensionPath: pkgRoot,
    globalState: createMockConfig(Settings.defaults({ rootDir: root })),
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

suite("Extension Test Suite - empty workspace", function () {
  const timeout = 60 * 1000;
  let root: string;

  beforeEach(async function () {
    root = FileTestUtils.tmpDir("/tmp/dendron", true);
  });

  afterEach(async () => {
    fs.removeSync(root);
  });

  describe("sanity", function () {
    vscode.window.showInformationMessage("Start sanity test.");
    this.timeout(timeout);

    test("new install", function (done) {
      vscode.window.showInformationMessage("waiting");
      setTimeout(function () {
        assert.ok(true);
        done();
      }, timeout);
    });
  });
});

// suite("Extension Test Suite", function () {
//   let root: string;
//   let actualFiles: string[];
//   let expectedFiles: string[];
//   let ws: DendronWorkspace;

//   beforeEach(async function () {
//     root = FileTestUtils.tmpDir("/tmp/dendron", true);

//     const ctx = createMockContext(root);

//     ws = new DendronWorkspace(ctx, { skipSetup: true });
//     await ws.setupWorkspace(root, { skipOpenWS: true });

//     // setup configWS
//     const wsFolder = VSCodeUtils.createWSFolder(path.join(root, "vault.main"));
//     ws.configWS = vscode.workspace.getConfiguration(undefined, wsFolder);

//     const fixtures = LernaTestUtils.getFixturesDir();
//     const storeDir = path.join(fixtures, "store");
//     console.log(storeDir);
//     fs.copySync(storeDir, root);
//     console.log(root);
//     return;
//   });

//   afterEach(async () => {
//     assert.deepEqual(actualFiles, expectedFiles);
//     fs.removeSync(root);
//   });

//   describe("settings", () => {
//     test("defaults", () => {
//       assert.deepStrictEqual(Settings.defaults({ rootDir: "bond" }), {
//         "dendron.rootDir": "bond",
//         "editor.minimap.enabled": false,
//         "files.autoSave": "onFocusChange",
//         "markdown-preview-enhanced.enableWikiLinkSyntax": true,
//         "materialTheme.accent": "Red",
//         "pasteImage.path": "${currentFileDir}/assets",
//         "spellright.documentTypes": ["markdown", "latex", "plaintext"],
//         "spellright.language": ["en"],
//         "vscodeMarkdownNotes.slugifyCharacter": "NONE",
//         "workbench.colorTheme": "Material Theme High Contrast",
//       });
//     });

//     test.skip("upgrade", async function () {
//       const bond = {
//         "bond.config": {
//           default: 42,
//         },
//       };
//       const changed = await Settings.upgrade(
//         ws.configWS as vscode.WorkspaceConfiguration,
//         bond
//       );
//       assert.deepStrictEqual(changed, { add: { "bond.config": 42 } });
//     });
//   });

//   describe("file system", () => {
//     test("new file", () => {
//       assert.ok(true);
//       [expectedFiles, actualFiles] = VSFileUtils.cmpFiles(
//         root,
//         LernaTestUtils.fixtureFilesForStore()
//       );
//     });
//   });

//   describe("workspace", () => {
//     test("sanity", async () => {
//       const workspace = fs.readJsonSync(
//         path.join(root, "dendron.code-workspace")
//       );
//       assert.deepStrictEqual(
//         workspace["settings"],
//         Settings.defaults({ rootDir: root })
//       );
//     });

//     test("reload", async () => {
//       await ws.reloadWorkspace(root);
//       assert.equal(ws.engine.notes["root"].children.length, 1);
//       const { content, data } = FileTestUtils.readMDFile(root, "foo.one.md");
//       assert.equal(_.trim(content), "");
//       const actual = testUtils.omitEntropicProps(data as NoteRawProps, true);
//       assert.deepEqual(actual, {
//         custom: {
//           bond: 42,
//         },
//         id: "foo.one",
//         title: "foo.one",
//       });
//       // stub node should not be written to disk
//       [expectedFiles, actualFiles] = VSFileUtils.cmpFiles(
//         root,
//         LernaTestUtils.fixtureFilesForStore()
//       );
//     });
//   });
// });
