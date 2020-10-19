import {
  DirResult,
  FileTestUtils,
  NodeTestUtils,
} from "@dendronhq/common-server";
import * as assert from "assert";
import _ from "lodash";
import { afterEach, beforeEach } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { BuildPodCommand } from "../../commands/BuildPod";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

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

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {
        NodeTestUtils.createNotes(path.join(root.name, "vault"), [
          {
            id: "id.foo",
            fname: "foo",
            body: "# Foo Content\n # Bar Content [[missing-link]]",
          },
        ]);
      },
    });
  });
});
