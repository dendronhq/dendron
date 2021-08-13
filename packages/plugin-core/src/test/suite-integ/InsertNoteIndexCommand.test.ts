import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { AssertUtils } from "@dendronhq/common-test-utils";
import * as vscode from "vscode";
import { describe } from "mocha";
import { InsertNoteIndexCommand } from "../../commands/InsertNoteIndexCommand";
import { VSCodeUtils } from "../../utils";
import { TIMEOUT } from "../testUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("InsertNoteIndex", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this);
  this.timeout(TIMEOUT);

  describe("basic", () => {
    test("basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          const cmd = new InsertNoteIndexCommand();

          await VSCodeUtils.openNote(notes["foo"]);
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(9, 0, 9, 0);
          await cmd.execute({});
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({
              body, 
              match: [
                [
                  "## Index",
                  "- [[Ch1|foo.ch1]]"
                ].join("\n")
              ]
            })
          );
          done();
        }
      });
    });
  });
});
