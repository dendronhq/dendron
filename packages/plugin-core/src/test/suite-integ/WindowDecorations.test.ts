import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { writeFile } from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import {
  EDITOR_DECORATION_TYPES,
  updateDecorations,
} from "../../features/windowDecorations";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { describe } from "mocha";
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

// eslint-disable-next-line func-names
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
          const { allDecorations } = await updateDecorations(editor);

          const timestampDecorations = allDecorations!.get(
            EDITOR_DECORATION_TYPES.timestamp
          );
          expect(timestampDecorations!.length).toEqual(2);
          // check that the decorations are at the right locations
          expect(
            isTextDecorated(CREATED, timestampDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated(UPDATED, timestampDecorations!, document)
          ).toBeTruthy();

          const blockAnchorDecorations = allDecorations!.get(
            EDITOR_DECORATION_TYPES.blockAnchor
          );
          expect(blockAnchorDecorations!.length).toEqual(3);
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
            EDITOR_DECORATION_TYPES.wikiLink
          );
          expect(wikilinkDecorations!.length).toEqual(4);
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

          const aliasDecorations = allDecorations!.get(
            EDITOR_DECORATION_TYPES.alias
          );
          expect(aliasDecorations!.length).toEqual(1);
          expect(
            isTextDecorated("with alias", aliasDecorations!, document)
          ).toBeTruthy();

          const brokenWikilinkDecorations = allDecorations!.get(
            EDITOR_DECORATION_TYPES.brokenWikilink
          );
          expect(brokenWikilinkDecorations!.length).toEqual(4);
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

    test("task notes", (done) => {
      const FNAME = "bar";

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            fname: "with.all",
            vault: vaults[0],
            wsRoot,
            custom: {
              status: "done",
              owner: "grace",
              priority: "H",
              due: "2021.10.29",
              tags: "foo",
            },
          });
          await NoteTestUtilsV4.createNote({
            fname: "without.status",
            vault: vaults[0],
            wsRoot,
            custom: {
              owner: "grace",
              priority: "high",
              tags: ["foo", "bar"],
            },
          });
          await NoteTestUtilsV4.createNote({
            fname: "without.due",
            vault: vaults[0],
            wsRoot,
            custom: {
              status: "",
              priority: "low",
            },
          });
          await NoteTestUtilsV4.createNote({
            fname: "not.a.task",
            vault: vaults[0],
            wsRoot,
          });
          await NoteTestUtilsV4.createNote({
            fname: FNAME,
            body: [
              "* [[with.all]]",
              "* foo [[without.status]] bar",
              "",
              "[[without.due]]",
              "",
              "[[not.a.task]]",
              "",
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
          const { allDecorations } = await updateDecorations(editor);

          const taskDecorations = allDecorations!.get(
            EDITOR_DECORATION_TYPES.taskNote
          );
          expect(taskDecorations!.length).toEqual(3);
          // check that the decorations are at the right locations
          expect(
            isTextDecorated("[[with.all]]", taskDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated("[[without.status]]", taskDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated("[[without.due]]", taskDecorations!, document)
          ).toBeTruthy();

          expect(
            taskDecorations![0].renderOptions?.before?.contentText
          ).toEqual("[x]");
          expect(taskDecorations![0].renderOptions?.after?.contentText).toEqual(
            "due:2021.10.29 @grace priority:high #foo"
          );
          expect(
            taskDecorations![1].renderOptions?.before?.contentText
          ).toBeFalsy();
          expect(taskDecorations![1].renderOptions?.after?.contentText).toEqual(
            "@grace priority:high #foo #bar"
          );
          expect(
            taskDecorations![2].renderOptions?.before?.contentText
          ).toEqual("[ ]");
          expect(taskDecorations![2].renderOptions?.after?.contentText).toEqual(
            "priority:low"
          );

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
          const { allDecorations } = await updateDecorations(editor);

          const wikilinkDecorations = allDecorations!.get(
            EDITOR_DECORATION_TYPES.wikiLink
          );
          expect(wikilinkDecorations!.length).toEqual(3);
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
            EDITOR_DECORATION_TYPES.brokenWikilink
          );
          expect(brokenWikilinkDecorations!.length).toEqual(3);
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
          const { allDecorations } = await updateDecorations(editor);

          const wikilinkDecorations = allDecorations!.get(
            EDITOR_DECORATION_TYPES.wikiLink
          );
          expect(wikilinkDecorations!.length).toEqual(1);
          expect(
            isTextDecorated("![[foo.bar.*]]", wikilinkDecorations!, document)
          ).toBeTruthy();

          done();
        },
      });
    });

    test("for long notes, only the visible range should be decorated", (done) => {
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

          const { allDecorations } = await updateDecorations(editor);

          // This note is really long, so not all links in it will be decorated (there are repeat * 2 many links)
          const brokenWikilinkDecorations = allDecorations!.get(
            EDITOR_DECORATION_TYPES.brokenWikilink
          );
          expect(brokenWikilinkDecorations!.length < repeat * 2).toBeTruthy();
          expect(
            isTextDecorated(
              "[[does.not.exist]]",
              brokenWikilinkDecorations!,
              document
            )
          ).toBeTruthy();
          expect(
            isTextDecorated(
              "#does.not.exist",
              brokenWikilinkDecorations!,
              document
            )
          ).toBeTruthy();

          done();
        },
      });
    });

    describe("WHEN disabled", () => {
      test("THEN decorations are not displayed", (done) => {
        const FNAME = "test.note";
        runLegacyMultiWorkspaceTest({
          ctx,
          modConfigCb: (config) => {
            config.workspace!.enableEditorDecorations = false;
            return config;
          },
          preSetupHook: async ({ vaults, wsRoot }) => {
            await NoteTestUtilsV4.createNote({
              fname: FNAME,
              body: "[[does.not.exist]] #does.not.exist\n",
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

            const { allDecorations, allWarnings } = await updateDecorations(
              editor
            );

            expect(allDecorations).toBeFalsy();
            expect(allWarnings).toBeFalsy();

            done();
          },
        });
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
          const { allWarnings } = await updateDecorations(editor);

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
          const { allWarnings } = await updateDecorations(editor);

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
          const { allWarnings } = await updateDecorations(editor);

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

          const { allDecorations, allWarnings } = await updateDecorations(
            editor!
          );

          expect(allWarnings).toEqual(undefined);
          expect(allDecorations).toEqual(undefined);
          done();
        },
      });
    });
  });
});

function checkRanges(
  range: vscode.Range | undefined,
  startLine: number,
  startChar: number,
  endLine: number,
  endChar: number
): boolean {
  expect(range?.start.line).toEqual(startLine);
  expect(range?.start.character).toEqual(startChar);
  expect(range?.end.line).toEqual(endLine);
  expect(range?.end.character).toEqual(endChar);
  return true;
}

suite("mergeOverlappingRanges", () => {
  describe("GIVEN a single range", () => {
    test("THEN that range is returned", () => {
      const ranges = VSCodeUtils.mergeOverlappingRanges([
        new vscode.Range(0, 0, 5, 0),
      ]);
      expect(ranges.length).toEqual(1);
      expect(checkRanges(ranges[0], 0, 0, 5, 0)).toBeTruthy();
    });
  });

  describe("GIVEN two ranges", () => {
    describe("AND ranges are NOT overlapping", () => {
      test("THEN both ranges are returned", () => {
        const ranges = VSCodeUtils.mergeOverlappingRanges([
          new vscode.Range(0, 0, 5, 0),
          new vscode.Range(8, 0, 12, 0),
        ]);
        expect(ranges.length).toEqual(2);
        expect(checkRanges(ranges[0], 0, 0, 5, 0)).toBeTruthy();
        expect(checkRanges(ranges[1], 8, 0, 12, 0)).toBeTruthy();
      });
    });

    describe("AND ranges are overlapping", () => {
      test("THEN ranges are merged", () => {
        const ranges = VSCodeUtils.mergeOverlappingRanges([
          new vscode.Range(0, 0, 5, 0),
          new vscode.Range(4, 0, 12, 0),
        ]);
        expect(ranges.length).toEqual(1);
        expect(checkRanges(ranges[0], 0, 0, 12, 0)).toBeTruthy();
      });
    });

    describe("AND ranges are just touching", () => {
      test("THEN both ranges are returned", () => {
        const ranges = VSCodeUtils.mergeOverlappingRanges([
          new vscode.Range(0, 0, 5, 0),
          new vscode.Range(5, 0, 12, 0),
        ]);
        expect(ranges.length).toEqual(1);
        expect(checkRanges(ranges[0], 0, 0, 12, 0)).toBeTruthy();
      });
    });
  });
});
