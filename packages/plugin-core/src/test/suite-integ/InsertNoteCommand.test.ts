import { vault2Path } from "@dendronhq/common-server";
import { AssertUtils } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import path from "path";
import sinon from "sinon";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { InsertNoteCommand } from "../../commands/InsertNoteCommand";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("InsertNoteCommand", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    afterHook: () => {
      sinon.restore();
    },
  });

  describe("insert note", function () {
    test("basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          const notePath = path.join(vault2Path({ vault, wsRoot }), "foo.md");
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
          const cmd = new InsertNoteCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              picks: [
                {
                  body: "template text",
                },
              ],
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(8, 0, 8, 12);
          const resp = await cmd.run();
          expect(resp).toEqual("template text");
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: ["template text"] })
          ).toBeTruthy();
          done();
        },
        preSetupHook: ENGINE_HOOKS.setupBasic,
      });
    });
  });
});
