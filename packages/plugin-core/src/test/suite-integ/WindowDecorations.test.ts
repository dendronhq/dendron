import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import { NoteUtils } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { DECORATION_TYPE_BLOCK_ANCHOR, DECORATION_TYPE_TAG, DECORATION_TYPE_TIMESTAMP, updateDecorations } from "../../features/windowDecorations";
import _ from "lodash";

/** Check if the ranges decorated by `decorations` contains `text` */
function isTextDecorated(
  text: string,
  decorations: vscode.DecorationOptions[],
  document: vscode.TextDocument
) {
  for (const decoration of decorations) {
    if (document.getText(decoration.range) === text) return true;
  }
  return false;
}

suite("windowDecorations", function () {
  const ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("decorations", () => {
    test("basic", (done) => {
      const CREATED = "1625648278263";
      const UPDATED = "1625758878263";
      const FNAME = "bar";

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            fname: FNAME,
            body: [
              "Ut incidunt id commodi. ^anchor-1",
              "",
              "* Et repudiandae optio ut suscipit illum hic vel.",
              "* Aut suscipit veniam nobis veniam reiciendis. ^anchor-2",
              "  * Sit sed accusamus saepe voluptatem sint animi quis animi. ^anchor-3",
              "* Dolores suscipit maiores nulla accusamus est.",
              "",
              "#foo",
              "#bar",
              "#foo",
            ].join("\n"),
            props: {
              created: _.toInteger(CREATED),
              updated: _.toInteger(UPDATED),
            },
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async ({ vaults, engine, wsRoot }) => {
          const note = NoteUtils.getNoteByFnameV5({
            fname: "bar",
            notes: engine.notes,
            vault: vaults[0],
            wsRoot,
          });
          const editor = await VSCodeUtils.openNote(note!);
          const document = editor.document;
          const allDecorations = updateDecorations(editor);

          const timestampDecorations = allDecorations.get(DECORATION_TYPE_TIMESTAMP);
          expect(timestampDecorations.length).toEqual(2);
          // check that the decorations are at the right locations
          expect(
            isTextDecorated(CREATED, timestampDecorations, document)
          ).toBeTruthy();
          expect(
            isTextDecorated(UPDATED, timestampDecorations, document)
          ).toBeTruthy();

          const blockAnchorDecorations = allDecorations.get(DECORATION_TYPE_BLOCK_ANCHOR);
          expect(blockAnchorDecorations.length).toEqual(3);
          // check that the decorations are at the right locations
          expect(
            isTextDecorated("^anchor-1", blockAnchorDecorations, document)
          ).toBeTruthy();
          expect(
            isTextDecorated("^anchor-2", blockAnchorDecorations, document)
          ).toBeTruthy();
          expect(
            isTextDecorated("^anchor-3", blockAnchorDecorations, document)
          ).toBeTruthy();

          expect(DECORATION_TYPE_TAG.has("tags.foo"));
          expect(DECORATION_TYPE_TAG.has("tags.bar"));

          done();
        },
      });
    });
  });
});
