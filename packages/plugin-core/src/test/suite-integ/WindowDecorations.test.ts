import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { DECORATION_TYPE_ALIAS, DECORATION_TYPE_BLOCK_ANCHOR, DECORATION_TYPE_TAG, DECORATION_TYPE_BROKEN_WIKILINK, DECORATION_TYPE_TIMESTAMP, DECORATION_TYPE_WIKILINK, updateDecorations } from "../../features/windowDecorations";
import _ from "lodash";
import { writeFile } from "fs-extra";
import path from "path";

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
    test("highlighting", (done) => {
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
              "[[root]]",
              "",
              "[[with alias|root]]",
              "",
              "[[does.not.exist]]",
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
          const {allDecorations} = updateDecorations(editor);

          const timestampDecorations = allDecorations!.get(DECORATION_TYPE_TIMESTAMP);
          expect(timestampDecorations.length).toEqual(2);
          // check that the decorations are at the right locations
          expect(
            isTextDecorated(CREATED, timestampDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated(UPDATED, timestampDecorations!, document)
          ).toBeTruthy();

          const blockAnchorDecorations = allDecorations!.get(DECORATION_TYPE_BLOCK_ANCHOR);
          expect(blockAnchorDecorations.length).toEqual(3);
          // check that the decorations are at the right locations
          expect(
            isTextDecorated("^anchor-1", blockAnchorDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated("^anchor-2", blockAnchorDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated("^anchor-3", blockAnchorDecorations!, document)
          ).toBeTruthy();

          const wikilinkDecorations = allDecorations!.get(DECORATION_TYPE_WIKILINK);
          expect(wikilinkDecorations.length).toEqual(2);
          expect(
            isTextDecorated("[[root]]", wikilinkDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated("[[with alias|root]]", wikilinkDecorations!, document)
          ).toBeTruthy();

          expect(DECORATION_TYPE_TAG.has("tags.foo"));
          expect(DECORATION_TYPE_TAG.has("tags.bar"));

          const aliasDecorations = allDecorations!.get(DECORATION_TYPE_ALIAS);
          expect(aliasDecorations.length).toEqual(1);
          expect(isTextDecorated("with alias", aliasDecorations!, document));

          const brokenWikilinkDecorations = allDecorations!.get(DECORATION_TYPE_BROKEN_WIKILINK);
          expect(brokenWikilinkDecorations.length).toEqual(1);
          expect(
            isTextDecorated("[[does.not.exist]]", brokenWikilinkDecorations!, document)
          ).toBeTruthy();
          done();
        },
      });
    });
  });

  describe("warnings", () => {
    test("missing frontmatter", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "foo",
            vault: vaults[0],
            wsRoot,
          });
          // Empty out the note, getting rid of the frontmatter
          const path = NoteUtils.getFullPath({note, wsRoot});
          await writeFile(path, "foo bar");
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(note!);
          const { allWarnings } = updateDecorations(editor);

          expect(allWarnings!.length).toEqual(1);
          expect(AssertUtils.assertInString({body: allWarnings![0].message, match: ["frontmatter", "missing"]}));
          done();
        },
      });
    });

    test("bad note id", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "foo",
            vault: vaults[0],
            wsRoot,
            props: {
              id: "-foo",
            },
          });
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(note!);
          const { allWarnings } = updateDecorations(editor);

          expect(allWarnings!.length).toEqual(1);
          expect(AssertUtils.assertInString({body: allWarnings![0].message, match: ["id", "bad"]}));
          done();
        },
      });
    });

    test("note id is missing", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "foo",
            vault: vaults[0],
            wsRoot,
          });
          // Rewrite the file to have id missing in frontmatter
          const path = NoteUtils.getFullPath({note, wsRoot});
          await writeFile(path, [
            "---",
            "updated: 234",
            "created: 123",
            "---",
          ].join("\n"));
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(note!);
          const { allWarnings } = updateDecorations(editor);

          expect(allWarnings!.length).toEqual(1);
          expect(AssertUtils.assertInString({body: allWarnings![0].message, match: ["id", "missing"]}));
          done();
        },
      });
    });

    test("doesn't warn for schemas", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({engine, wsRoot}) => {
          const schema = engine.schemas.root;
          const schemaFile = path.join(wsRoot, schema.vault.fsPath, `${schema.fname}.schema.yml`);
          const schemaURI = vscode.Uri.parse(schemaFile);
          const editor = await VSCodeUtils.openFileInEditor(schemaURI);
          
          const { allDecorations, allWarnings } = updateDecorations(editor!);

          expect(allWarnings).toEqual(undefined);
          expect(allDecorations).toEqual(undefined);
          done();
        },
      });
    });
  });
});
