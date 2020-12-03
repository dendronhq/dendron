import { DirResult, tmpDir } from "@dendronhq/common-server";
import { NodeTestUtilsV2 } from "@dendronhq/common-test-utils";
import * as assert from "assert";
import _ from "lodash";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { BuildPodCommand } from "../../commands/BuildPod";
import { VSCodeUtils } from "../../utils";
import { _activate } from "../../_extension";
import { onWSInit } from "../testUtils";
import { setupCodeWorkspaceV2 } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("Build Site", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = tmpDir();
    },
  });

  test("missing link", function (done) {
    onWSInit(async () => {
      await new BuildPodCommand().execute({});
      const editor = VSCodeUtils.getActiveTextEditor();
      // there's a webview present
      assert.ok(_.isUndefined(editor));
      done();
    });

    setupCodeWorkspaceV2({
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
    }).then(() => _activate(ctx));
  });
});
