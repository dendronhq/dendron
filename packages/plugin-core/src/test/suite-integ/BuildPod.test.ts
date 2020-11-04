import { DirResult, FileTestUtils } from "@dendronhq/common-server";
import { NodeTestUtilsV2 } from "@dendronhq/common-test-utils";
import * as assert from "assert";
import _ from "lodash";
import { afterEach, beforeEach } from "mocha";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { BuildPodCommand } from "../../commands/BuildPod";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, TIMEOUT } from "../testUtils";
import { setupCodeWorkspaceV2 } from "../testUtilsv2";

suite.skip("Build Site", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("missing link", function (done) {
    onWSInit(async () => {
      await new BuildPodCommand().execute({});
      const editor = VSCodeUtils.getActiveTextEditor();
      // there's a webview present
      assert.ok(_.isUndefined(editor));
      done();
    });

    return setupCodeWorkspaceV2({
      ctx,
      wsRoot: root.name,
      initDirCb: async (vaultPath) => {
        await NodeTestUtilsV2.createNotes({
          vaultPath,
          noteProps: [
            {
              id: "id.foo",
              fname: "foo",
              body: "# Foo Content\n # Bar Content [[missing-link]]",
            },
          ],
        });
      },
    });
  });
});
