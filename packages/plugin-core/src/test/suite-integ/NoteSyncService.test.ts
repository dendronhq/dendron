import { AssertUtils } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe } from "mocha";
import * as vscode from "vscode";
import { NoteSyncService } from "../../services/NoteSyncService";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("NoteSyncService", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("onDidChange", function () {
    test("onDidChange: change", function (done) {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ engine }) => {
          const foo = engine.notes["foo"];
          const editor = await VSCodeUtils.openNote(foo);
          await editor?.edit((builder) => {
            const pos = new vscode.Position(10, 0);
            const selection = new vscode.Selection(pos, pos);
            builder.replace(selection, `Hello`);
          });
          const uri = editor.document.uri;
          const resp = await NoteSyncService.instance().onDidChange(uri);
          expect(resp?.contentHash).toEqual("465a4f4ebf83fbea836eb7b8e8e040ec");
          expect(
            await AssertUtils.assertInString({
              body: engine.notes["foo"].body,
              match: ["Hello"],
            })
          ).toBeTruthy();
          done();
        },
      });
    });

    test("onDidChange: no change", function (done) {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ engine }) => {
          const foo = engine.notes["foo"];
          const editor = await VSCodeUtils.openNote(foo);
          const uri = editor.document.uri;
          const resp = await NoteSyncService.instance().onDidChange(uri);
          expect(_.isUndefined(resp)).toBeTruthy();
          done();
        },
      });
    });
  });
});
