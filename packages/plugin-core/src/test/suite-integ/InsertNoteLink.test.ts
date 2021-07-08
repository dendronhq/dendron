import { AssertUtils, sinon } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { InsertNoteLinkCommand } from "../../commands/InsertNoteLink";
import { VSCodeUtils } from "../../utils";
import { TIMEOUT } from "../testUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("InsertNoteLink", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);
  ctx = setupBeforeAfter(this, {
    afterHook: async () => {
      sinon.restore();
    },
  });

  describe("basic", () => {
    test("basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"]],
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(10, 0, 10, 12);
          await cmd.run();
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: ["[[foo]]"] })
          ).toBeTruthy();
          done();
        },
      });
    });
  });
});
