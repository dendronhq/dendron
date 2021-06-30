import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import _ from "lodash";
import {
  provideBlockCompletionItems,
  provideCompletionItems,
} from "../../features/completionProvider";
import { VSCodeUtils } from "../../utils";
import { CompletionItem, Position } from "vscode";
import { NoteUtils } from "@dendronhq/common-all";
import { expect } from "../testUtilsv2";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";

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

  describe("blocks", () => {
    test("doesn't provide outside wikilink", (done) => {
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
            editBuilder.insert(new Position(8, 0), "^");
          });
          // have the completion provider complete this wikilink
          const items = await provideBlockCompletionItems(
            editor.document,
            new Position(8, 1)
          );
          expect(items).toEqual(undefined);
          done();
        },
        preSetupHook: ENGINE_HOOKS.setupBasic,
      });
    });

    test("provides paragraphs", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults, engine }) => {
          // Open a note, add [[^]]
          await VSCodeUtils.openNote(
            NoteUtils.getNoteOrThrow({
              fname: "test",
              vault: vaults[0],
              wsRoot,
              notes: engine.notes,
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          await editor.edit((editBuilder) => {
            editBuilder.insert(new Position(8, 0), "[[^]]");
          });
          // have the completion provider complete this wikilink
          const items = await provideBlockCompletionItems(
            editor.document,
            new Position(8, 3)
          );
          expect(items).toBeTruthy();
          expect(items?.length).toEqual(3);
          // check that the
          done();
        },
        preSetupHook: async ({ wsRoot, vaults }) => {
          NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "test",
            body: [
              "Et et quam culpa.",
              "",
              "Cumque molestiae qui deleniti.",
              "Eius odit commodi harum.",
              "",
              "Sequi ut non delectus tempore.",
            ].join("\n"),
          });
        },
      });
    });

    test("provides nested lists", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults, engine }) => {
          // Open a note, add [[^]]
          await VSCodeUtils.openNote(
            NoteUtils.getNoteOrThrow({
              fname: "test",
              vault: vaults[0],
              wsRoot,
              notes: engine.notes,
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          await editor.edit((editBuilder) => {
            editBuilder.insert(new Position(8, 0), "[[^]]");
          });
          // have the completion provider complete this wikilink
          const items = await provideBlockCompletionItems(
            editor.document,
            new Position(8, 3)
          );
          expect(items).toBeTruthy();
          expect(items?.length).toEqual(8);
          done();
        },
        preSetupHook: async ({ wsRoot, vaults }) => {
          NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "test",
            body: [
              "Et et quam culpa.",
              "",
              "* Cumque molestiae qui deleniti.",
              "* Eius odit commodi harum.",
              "  * Sequi ut non delectus tempore.",
              "  * In delectus quam sunt unde.",
              "* Quasi ex debitis aut sed.",
              "",
              "Perferendis officiis ut non.",
            ].join("\n"),
          });
        },
      });
    });

    function hasNoEditContaining(
      item: CompletionItem,
      newTextSubString: string
    ) {
      expect(
        _.find(
          item.additionalTextEdits,
          (edit) => edit.newText.indexOf(newTextSubString) !== -1
        )
      ).toEqual(undefined);
    }

    test("provides existing anchors", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults, engine }) => {
          // Open a note, add [[^]]
          await VSCodeUtils.openNote(
            NoteUtils.getNoteOrThrow({
              fname: "test",
              vault: vaults[0],
              wsRoot,
              notes: engine.notes,
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          await editor.edit((editBuilder) => {
            editBuilder.insert(new Position(8, 0), "[[^]]");
          });
          // have the completion provider complete this wikilink
          const items = await provideBlockCompletionItems(
            editor.document,
            new Position(8, 3)
          );
          // Check that the correct anchors were returned
          expect(items).toBeTruthy();
          expect(items!.length).toEqual(7);
          expect(items![0].insertText).toEqual("#et-et-quam-culpa");
          expect(items![1].insertText).toEqual("#^paragraph");
          expect(items![2].insertText).toEqual("#^item1");
          expect(items![3].insertText).toEqual("#^item2");
          expect(items![4].insertText).toEqual("#^item3");
          expect(items![5].insertText).toEqual("#^list");
          expect(items![6].insertText).toEqual("#^table");
          // check that we're not trying to insert unnecessary anchors
          hasNoEditContaining(items![0], "et-et-quam-culpa");
          hasNoEditContaining(items![0], "^");
          hasNoEditContaining(items![1], "^paragraph");
          hasNoEditContaining(items![2], "^item1");
          hasNoEditContaining(items![3], "^item2");
          hasNoEditContaining(items![4], "^item3");
          hasNoEditContaining(items![5], "^list");
          hasNoEditContaining(items![6], "^table");
          done();
        },
        preSetupHook: async ({ wsRoot, vaults }) => {
          NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "test",
            body: [
              "# Et et quam culpa. ^header",
              "",
              "Ullam vel eius reiciendis. ^paragraph",
              "",
              "* Cumque molestiae qui deleniti. ^item1",
              "* Eius odit commodi harum. ^item2",
              "  * Sequi ut non delectus tempore. ^item3",
              "",
              "^list",
              "",
              "| Sapiente | accusamus |",
              "|----------|-----------|",
              "| Laborum  | libero    |",
              "| Ullam    | optio     | ^table",
            ].join("\n"),
          });
        },
      });
    });
  });
});
