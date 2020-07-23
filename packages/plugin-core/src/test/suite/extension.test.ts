import { NoteRawProps, testUtils } from "@dendronhq/common-all";
import { FileTestUtils, LernaTestUtils } from "@dendronhq/common-server";
import * as assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, beforeEach, describe, before } from "mocha";
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
import { DENDRON_COMMANDS, CONFIG, GLOBAL_STATE } from "../../constants";
import { HistoryService, HistoryEvent } from "../../services/HistoryService";

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

suite("startup", function () {
  const timeout = 60 * 1000;
  let root: string;
  let ws: DendronWorkspace;

  before(function () {
    console.log("set version");
    VSCodeUtils.getOrCreateMockContext().globalState.update(
      GLOBAL_STATE.VERSION,
      "0.0.1"
    );
  });

  beforeEach(function () {
    console.log("before");
    root = FileTestUtils.tmpDir("/tmp/dendron", true);
  });

  afterEach(function () {
    console.log("after");
    HistoryService.instance().clearSubscriptions();
    fs.removeSync(root);
  });

  describe("sanity", function () {
    vscode.window.showInformationMessage("Start sanity test.");
    this.timeout(timeout);

    // test("new install", function (done) {
    //   vscode.window.showInformationMessage("waiting for new");
    //   HistoryService.instance().subscribe("extension", async (event: HistoryEvent) => {
    //     vscode.window.showInformationMessage(`got activate`);
    //     ws = DendronWorkspace.instance();
    //     await ws.setupWorkspace(root, {skipOpenWS: true});
    //     await ws.reloadWorkspace(root);
    //     vscode.window.showInformationMessage(`setup ws`);
    //     assert.ok("done");
    //     done();
    //   });
    // });

    test("upgrade from existing", function (done) {
      vscode.window.showInformationMessage("waiting for existing");
      ws = DendronWorkspace.instance();
      HistoryService.instance().subscribe(
        "extension",
        async (event: HistoryEvent) => {
          vscode.window.showInformationMessage(`got activate`);
          ws = DendronWorkspace.instance();
          await ws.setupWorkspace(root, { skipOpenWS: true });
          await ws.reloadWorkspace(root);
          vscode.window.showInformationMessage(`setup ws`);
          assert.ok("done");
          done();
        }
      );
    });
  });
});

// suite("existing install", function () {
//   const timeout = 60 * 1000;
//   let root: string;
//   let ws: DendronWorkspace;

//   beforeEach(async function () {
//     root = FileTestUtils.tmpDir("/tmp/dendron", true);
//   });

//   afterEach(async () => {
//     fs.removeSync(root);
//   });

//   describe("sanity", function () {
//     vscode.window.showInformationMessage("Start sanity test on new.");
//     this.timeout(timeout);

//     test("new install", function (done) {
//       vscode.window.showInformationMessage("waiting");
//       HistoryService.instance().subscribe("extension", async (event: HistoryEvent) => {
//         vscode.window.showInformationMessage(`got activate`);
//         ws = DendronWorkspace.instance();
//         await ws.setupWorkspace(root, {skipOpenWS: true});
//         await ws.reloadWorkspace(root);
//         vscode.window.showInformationMessage(`setup ws`);
//         assert.ok("done");
//         done();
//       });
//     });
//   });
// });

