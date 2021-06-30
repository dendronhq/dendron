import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import _ from "lodash";
import { provideCompletionItems } from "../../features/completionProvider";
import { VSCodeUtils } from "../../utils";
import { Position } from "vscode";
import { NoteUtils } from "@dendronhq/common-all";
import { expect } from "../testUtilsv2";

suite("completionProvider", function () {
  let ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("wikilink", () => {
    test("basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults, engine }) => {
          // Open a note, add [[]]
          await VSCodeUtils.openNote(
            NoteUtils.getNoteOrThrow({
              fname: "root",
              vault: vaults[0],
              wsRoot,
              notes: engine.notes,
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          await editor.edit((editBuilder) => {
            editBuilder.insert(new Position(8, 0), "[[]]");
          });
          // have the completion provider complete this wikilink
          const items = provideCompletionItems(
            editor.document,
            new Position(8, 2)
          );
          expect(items).toBeTruthy();
          // Suggested all the notes
          expect(items!.length).toEqual(6);
          for (const item of items!) {
            // All suggested items exist
            const found = NoteUtils.getNotesByFname({
              fname: item.insertText as string,
              notes: engine.notes,
            });
            expect(found.length > 0).toBeTruthy();
          }
          done();
        },
        preSetupHook: ENGINE_HOOKS.setupBasic,
      });
    });
  });
});
