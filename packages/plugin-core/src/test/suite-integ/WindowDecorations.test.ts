import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { writeFile } from "fs-extra";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import {
  DECORATION_TYPE,
  updateDecorations,
} from "../../features/windowDecorations";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  runTestButSkipForWindows,
  setupBeforeAfter,
} from "../testUtilsV3";

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

  //TODO: Fix tests on Windows Test Pass
  const runTestExceptOnWindows = runTestButSkipForWindows();

  runTestExceptOnWindows("decorations", () => {
    test("highlighting", (done) => {
      const CREATED = "1625648278263";
      const UPDATED = "1625758878263";
      const FNAME = "bar";

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            fname: "tags.bar",
            vault: vaults[0],
            wsRoot,
          });
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
              "@Hamilton.Margaret",
              "",
              "[[with alias|root]]",
              "",
              "![[root.*#head]]",
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
            fname: FNAME,
            notes: engine.notes,
            vault: vaults[0],
            wsRoot,
          });
          const editor = await VSCodeUtils.openNote(note!);
          const document = editor.document;
          const { allDecorations } = updateDecorations(editor);

          const timestampDecorations = allDecorations!.get(
            DECORATION_TYPE.timestamp
          );
          expect(timestampDecorations.length).toEqual(2);
          // check that the decorations are at the right locations
          expect(
            isTextDecorated(CREATED, timestampDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated(UPDATED, timestampDecorations!, document)
          ).toBeTruthy();

          const blockAnchorDecorations = allDecorations!.get(
            DECORATION_TYPE.blockAnchor
          );
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

          const wikilinkDecorations = allDecorations!.get(
            DECORATION_TYPE.wikiLink
          );
          expect(wikilinkDecorations.length).toEqual(4);
          expect(
            isTextDecorated("[[root]]", wikilinkDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated(
              "[[with alias|root]]",
              wikilinkDecorations!,
              document
            )
          ).toBeTruthy();
          expect(
            isTextDecorated("#bar", wikilinkDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated("![[root.*#head]]", wikilinkDecorations!, document)
          ).toBeTruthy();

          const aliasDecorations = allDecorations!.get(DECORATION_TYPE.alias);
          expect(aliasDecorations.length).toEqual(1);
          expect(
            isTextDecorated("with alias", aliasDecorations!, document)
          ).toBeTruthy();

          const brokenWikilinkDecorations = allDecorations!.get(
            DECORATION_TYPE.brokenWikilink
          );
          expect(brokenWikilinkDecorations.length).toEqual(4);
          expect(
            isTextDecorated(
              "[[does.not.exist]]",
              brokenWikilinkDecorations!,
              document
            )
          ).toBeTruthy();
          expect(
            isTextDecorated(
              "@Hamilton.Margaret",
              brokenWikilinkDecorations!,
              document
            )
          ).toBeTruthy();
          expect(
            isTextDecorated("#foo", brokenWikilinkDecorations!, document)
          ).toBeTruthy();

          done();
        },
      });
    });

    test("highlighting same file wikilinks", (done) => {
      const FNAME = "bar";

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            fname: FNAME,
            body: [
              "Ut incidunt id commodi. ^anchor-1",
              "",
              "[[#^anchor-1]]",
              "[[#^anchor-not-exists]]",
              "![[#^anchor-1]]",
              "![[#^anchor-not-exists]]",
              "![[#^anchor-1:#*]]",
              "![[#^anchor-not-exists]]",
            ].join("\n"),
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async ({ vaults, engine, wsRoot }) => {
          const note = NoteUtils.getNoteByFnameV5({
            fname: FNAME,
            notes: engine.notes,
            vault: vaults[0],
            wsRoot,
          });
          const editor = await VSCodeUtils.openNote(note!);
          const document = editor.document;
          const { allDecorations } = updateDecorations(editor);

          const wikilinkDecorations = allDecorations!.get(
            DECORATION_TYPE.wikiLink
          );
          expect(wikilinkDecorations.length).toEqual(3);
          expect(
            isTextDecorated("[[#^anchor-1]]", wikilinkDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated("![[#^anchor-1]]", wikilinkDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated(
              "![[#^anchor-1:#*]]",
              wikilinkDecorations!,
              document
            )
          ).toBeTruthy();

          const brokenWikilinkDecorations = allDecorations!.get(
            DECORATION_TYPE.brokenWikilink
          );
          expect(brokenWikilinkDecorations.length).toEqual(3);
          expect(
            isTextDecorated(
              "[[#^anchor-not-exists]]",
              brokenWikilinkDecorations!,
              document
            )
          ).toBeTruthy();
          expect(
            isTextDecorated(
              "![[#^anchor-not-exists]]",
              brokenWikilinkDecorations!,
              document
            )
          ).toBeTruthy();
          expect(
            isTextDecorated(
              "![[#^anchor-not-exists]]",
              brokenWikilinkDecorations!,
              document
            )
          ).toBeTruthy();

          done();
        },
      });
    });

    test("highlighting wildcard references", (done) => {
      const FNAME = "bar";

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            fname: FNAME,
            body: ["![[foo.bar.*]]"].join("\n"),
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async ({ vaults, engine, wsRoot }) => {
          const note = NoteUtils.getNoteByFnameV5({
            fname: FNAME,
            notes: engine.notes,
            vault: vaults[0],
            wsRoot,
          });
          const editor = await VSCodeUtils.openNote(note!);
          const document = editor.document;
          const { allDecorations } = updateDecorations(editor);

          const wikilinkDecorations = allDecorations!.get(
            DECORATION_TYPE.wikiLink
          );
          expect(wikilinkDecorations.length).toEqual(1);
          expect(
            isTextDecorated("![[foo.bar.*]]", wikilinkDecorations!, document)
          ).toBeTruthy();

          done();
        },
      });
    });

    test("for long notes, disables expensive decorations & warns the user", (done) => {
      const FNAME = "test.note";
      const repeat = 228;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            fname: FNAME,
            body: _.repeat("[[does.not.exist]] #does.not.exist\n", repeat),
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async ({ vaults, engine, wsRoot }) => {
          const note = NoteUtils.getNoteByFnameV5({
            fname: FNAME,
            notes: engine.notes,
            vault: vaults[0],
            wsRoot,
          });
          const editor = await VSCodeUtils.openNote(note!);
          const document = editor.document;

          const showInfo = sinon.stub(vscode.window, "showWarningMessage");

          const { allDecorations, expensiveDecorationWarning } =
            updateDecorations(editor);

          // Checking if notes exist is expensive, so we shouldn't have done that
          const brokenWikilinkDecorations = allDecorations!.get(
            DECORATION_TYPE.brokenWikilink
          );
          expect(brokenWikilinkDecorations.length).toEqual(0);
          // Instead, all wikilinks will appear as existing even if they are missing
          const wikilinkDecorations = allDecorations!.get(
            DECORATION_TYPE.wikiLink
          );
          expect(wikilinkDecorations.length).toEqual(repeat * 2);
          expect(
            isTextDecorated(
              "[[does.not.exist]]",
              wikilinkDecorations!,
              document
            )
          ).toBeTruthy();
          expect(
            isTextDecorated("#does.not.exist", wikilinkDecorations!, document)
          ).toBeTruthy();

          // The user should only have been warned once
          await expensiveDecorationWarning;
          expect(showInfo.calledOnce).toBeTruthy();

          // The user should not get warned a second time
          const { expensiveDecorationWarning: expensiveDecorationWarning2 } =
            updateDecorations(editor);
          await expensiveDecorationWarning2;
          expect(showInfo.calledOnce).toBeTruthy();

          done();
        },
      });
    });
  });

  runTestExceptOnWindows("warnings", () => {
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
          const path = NoteUtils.getFullPath({ note, wsRoot });
          await writeFile(path, "foo bar");
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(note!);
          const { allWarnings } = updateDecorations(editor);

          expect(allWarnings!.length).toEqual(1);
          expect(
            AssertUtils.assertInString({
              body: allWarnings![0].message,
              match: ["frontmatter", "missing"],
            })
          );
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
          expect(
            AssertUtils.assertInString({
              body: allWarnings![0].message,
              match: ["id", "bad"],
            })
          );
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
          const path = NoteUtils.getFullPath({ note, wsRoot });
          await writeFile(
            path,
            ["---", "updated: 234", "created: 123", "---"].join("\n")
          );
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(note!);
          const { allWarnings } = updateDecorations(editor);

          expect(allWarnings!.length).toEqual(1);
          expect(
            AssertUtils.assertInString({
              body: allWarnings![0].message,
              match: ["id", "missing"],
            })
          );
          done();
        },
      });
    });

    test("doesn't warn for schemas", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ engine, wsRoot }) => {
          const schema = engine.schemas.root;
          const schemaFile = path.join(
            wsRoot,
            schema.vault.fsPath,
            `${schema.fname}.schema.yml`
          );
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
