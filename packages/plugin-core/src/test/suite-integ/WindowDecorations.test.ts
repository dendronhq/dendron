import { Awaited, NoteUtils } from "@dendronhq/common-all";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { writeFile } from "fs-extra";
import _ from "lodash";
import { before, describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import {
  EDITOR_DECORATION_TYPES,
  updateDecorations,
} from "../../features/windowDecorations";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { expect } from "../testUtilsv2";
import { describeMultiWS, runTestButSkipForWindows } from "../testUtilsV3";

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

async function getNote(opts: { fname: string }) {
  const ws = ExtensionProvider.getDWorkspace();
  const { engine } = ws;
  const vaults = await ws.vaults;
  const { fname } = opts;

  const note = (await engine.findNotesMeta({ fname, vault: vaults[0] }))[0];
  const editor = await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
    note
  );
  return { note, editor };
}

function getDecorations({
  allDecorations,
  decorationType,
}: {
  allDecorations: Awaited<
    ReturnType<typeof updateDecorations>
  >["allDecorations"];
  decorationType: vscode.TextEditorDecorationType;
}) {
  return allDecorations!.get(decorationType);
}

function checkDecoration({
  text,
  document,
  decorations,
}: {
  text: string;
  document: vscode.TextDocument;
  decorations?: vscode.DecorationOptions[];
}) {
  expect(isTextDecorated(text, decorations!, document)).toBeTruthy();
}

suite("GIVEN a text document with decorations", function () {
  const CREATED = "1625648278263";
  const UPDATED = "1625758878263";
  const FNAME = "bar";
  this.timeout(5e3);

  describe("AND GIVEN links ", () => {
    function checkTimestampsDecorated({
      decorations,
      document,
    }: {
      decorations: Awaited<ReturnType<typeof updateDecorations>>;
      document: vscode.TextDocument;
    }) {
      const { allDecorations } = decorations;
      const timestampDecorations = getDecorations({
        allDecorations,
        decorationType: EDITOR_DECORATION_TYPES.timestamp,
      });
      expect(timestampDecorations!.length).toEqual(2);
      // check that the decorations are at the right locations
      checkDecoration({
        text: CREATED,
        decorations: timestampDecorations,
        document,
      });
      checkDecoration({
        text: UPDATED,
        decorations: timestampDecorations,
        document,
      });
    }

    describeMultiWS(
      "",
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NoteTestUtilsV4.createNote({
            fname: "withHeader",
            vault: vaults[0],
            wsRoot,
            body: "## ipsam adipisci",
          });
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
              "[[withHeader#ipsam-adipisci]]",
              "[[withHeader#does-not-exist]]",
              "",
              "[[does.not.exist]]",
              "",
              "[[/test.txt]]",
              "[[/test.txt#L3]]",
            ].join("\n"),
            props: {
              created: _.toInteger(CREATED),
              updated: _.toInteger(UPDATED),
              tags: ["foo", "bar"],
            },
            vault: vaults[0],
            wsRoot,
          });
          await writeFile(
            path.join(wsRoot, "test.txt"),
            "et\nnam\nvelit\nlaboriosam\n"
          );
        },
      },
      () => {
        // TODO: this is currently a regression from refactoring engine
        test.skip("THEN links are decorated", async () => {
          const { editor } = await getNote({ fname: FNAME });
          const document = editor.document;
          const decorations = (await updateDecorations(editor))!;
          const { allDecorations } = decorations;

          checkTimestampsDecorated({ decorations, document });

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

          const wikilinkDecorations = getDecorations({
            allDecorations,
            decorationType: EDITOR_DECORATION_TYPES.wikiLink,
          });
          expect(wikilinkDecorations!.length).toEqual(8);
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
          expect(
            isTextDecorated(
              "[[withHeader#ipsam-adipisci]]",
              wikilinkDecorations!,
              document
            )
          ).toBeTruthy();
          expect(
            isTextDecorated("[[/test.txt]]", wikilinkDecorations!, document)
          ).toBeTruthy();
          expect(
            isTextDecorated("[[/test.txt#L3]]", wikilinkDecorations!, document)
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
          expect(brokenWikilinkDecorations!.length).toEqual(5);
          expect(
            isTextDecorated(
              "[[does.not.exist]]",
              brokenWikilinkDecorations!,
              document
            )
          ).toBeTruthy();
          expect(
            isTextDecorated(
              "[[withHeader#does-not-exist]]",
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
          return;
        });
      }
    );
  });

  describe("AND GIVEN task notes", () => {
    describeMultiWS(
      "",
      {
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
      },
      () => {
        test("THEN task notes are highlighted", async () => {
          const { editor } = await getNote({ fname: FNAME });
          const document = editor.document;
          const { allDecorations } = (await updateDecorations(editor))!;

          const taskDecorations = allDecorations!.get(
            EDITOR_DECORATION_TYPES.taskNote
          );
          taskDecorations?.sort((decoration) => decoration.range.start.line); // for easier testing
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
          ).toEqual("[ ] ");
          expect(taskDecorations![0].renderOptions?.after?.contentText).toEqual(
            " priority:low"
          );
          expect(
            taskDecorations![1].renderOptions?.before?.contentText
          ).toEqual("[x] ");
          expect(taskDecorations![1].renderOptions?.after?.contentText).toEqual(
            " due:2021.10.29 @grace priority:high #foo"
          );
          expect(
            taskDecorations![2].renderOptions?.before?.contentText
          ).toBeFalsy();
          expect(taskDecorations![2].renderOptions?.after?.contentText).toEqual(
            " @grace priority:high #foo #bar"
          );
        });
      }
    );
  });

  describe("AND GIVEN file with wikilinks to itself", () => {
    describeMultiWS(
      "",
      {
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
              "[[#^begin]]",
              "[[#^end]]",
              "![[#^begin]]",
              "![[#^end]]",
              "![[#^begin:#^end]]",
              "![[#^anchor-1:#^end]]",
              "![[#^begin:#^anchor-1]]",
            ].join("\n"),
            vault: vaults[0],
            wsRoot,
          });
        },
      },
      () => {
        test("THEN links are highlighted", async () => {
          const { editor } = await getNote({ fname: FNAME });
          const document = editor.document;
          const { allDecorations } = (await updateDecorations(editor))!;

          const wikilinkDecorations = allDecorations!
            .get(EDITOR_DECORATION_TYPES.wikiLink)!
            .concat(allDecorations!.get(EDITOR_DECORATION_TYPES.noteRef)!);

          expect(wikilinkDecorations.length).toEqual(10);
          const shouldBeDecorated = [
            "[[#^anchor-1]]",
            "![[#^anchor-1]]",
            "![[#^anchor-1:#*]]",
            "[[#^begin]]",
            "[[#^end]]",
            "![[#^begin]]",
            "![[#^end]]",
            "![[#^begin:#^end]]",
            "![[#^anchor-1:#^end]]",
            "![[#^begin:#^anchor-1]]",
          ];
          shouldBeDecorated.forEach((text) => {
            expect(
              isTextDecorated(text, wikilinkDecorations, document)
            ).toBeTruthy();
          });

          const brokenWikilinkDecorations = allDecorations!
            .get(EDITOR_DECORATION_TYPES.brokenWikilink)!
            .concat(
              allDecorations!.get(EDITOR_DECORATION_TYPES.brokenNoteRef)!
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
        });
      }
    );
  });

  describe("AND given wildcard references", () => {
    describeMultiWS(
      "",
      {
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            fname: FNAME,
            body: ["![[foo.bar.*]]"].join("\n"),
            vault: vaults[0],
            wsRoot,
          });
        },
      },
      () => {
        test("THEN links are highlighted", async () => {
          const { editor } = await getNote({ fname: FNAME });
          const document = editor.document;
          const { allDecorations } = (await updateDecorations(editor))!;

          const wikilinkDecorations = (
            allDecorations!.get(EDITOR_DECORATION_TYPES.wikiLink) || []
          ).concat(allDecorations!.get(EDITOR_DECORATION_TYPES.noteRef) || []);
          expect(wikilinkDecorations!.length).toEqual(1);
          expect(
            isTextDecorated("![[foo.bar.*]]", wikilinkDecorations!, document)
          ).toBeTruthy();
        });
      }
    );
  });

  describe("AND for long notes", () => {
    const FNAME = "test.note";
    const repeat = 228;
    describeMultiWS(
      "",
      {
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            fname: FNAME,
            body: _.repeat("[[does.not.exist]] #does.not.exist\n", repeat),
            vault: vaults[0],
            wsRoot,
          });
        },
      },
      () => {
        test("THEN only the visible range should be decorated", async () => {
          const { editor } = await getNote({ fname: FNAME });
          const document = editor.document;

          const { allDecorations } = (await updateDecorations(editor))!;

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
        });
      }
    );
  });

  describe("AND WHEN disabled", () => {
    describeMultiWS(
      "",
      {
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
      },
      () => {
        test("THEN decorations are not displayed ", async () => {
          const { editor } = await getNote({ fname: FNAME });

          const { allDecorations, allWarnings } = (await updateDecorations(
            editor
          ))!;

          expect(allDecorations).toBeFalsy();
          expect(allWarnings).toBeFalsy();
        });
      }
    );
  });

  describe("AND GIVEN warnings in document", () => {
    // SKIP. Notes without frontmatter should no longer exist in the engine
    describeMultiWS.skip(
      "AND WHEN missing frontmatter",
      {
        preSetupHook: async ({ vaults, wsRoot }) => {
          const note = await NoteTestUtilsV4.createNote({
            fname: FNAME,
            vault: vaults[0],
            wsRoot,
          });
          // Empty out the note, getting rid of the frontmatter
          const path = NoteUtils.getFullPath({ note, wsRoot });
          await writeFile(path, "foo bar");
        },
      },
      () => {
        test("THEN show frontmatter missing warning", async () => {
          const { editor } = await getNote({ fname: FNAME });
          const { allWarnings } = (await updateDecorations(editor))!;

          expect(allWarnings!.length).toEqual(1);
          expect(
            AssertUtils.assertInString({
              body: allWarnings![0].message,
              match: ["frontmatter", "missing"],
            })
          );
        });
      }
    );

    describeMultiWS(
      "AND WHEN bad note id",
      {
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            fname: FNAME,
            vault: vaults[0],
            wsRoot,
            props: {
              id: "-foo",
            },
          });
        },
      },
      () => {
        test("THEN show frontmatter missing warning", async () => {
          const { editor } = await getNote({ fname: FNAME });
          const { allWarnings } = (await updateDecorations(editor))!;
          expect(allWarnings!.length).toEqual(1);
          expect(
            AssertUtils.assertInString({
              body: allWarnings![0].message,
              match: ["id", "bad"],
            })
          );
        });
      }
    );

    describeMultiWS(
      "AND WHEN note id is missing",
      {
        preSetupHook: async ({ vaults, wsRoot }) => {
          const note = await NoteTestUtilsV4.createNote({
            fname: FNAME,
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
      },
      () => {
        test("THEN show frontmatter missing warning", async () => {
          const { editor } = await getNote({ fname: FNAME });
          const { allWarnings } = (await updateDecorations(editor))!;
          expect(allWarnings!.length).toEqual(1);
          expect(
            AssertUtils.assertInString({
              body: allWarnings![0].message,
              match: ["id", "missing"],
            })
          );
        });
      }
    );

    describeMultiWS("AND frontmatter is not visible", {}, () => {
      before(async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const note = await NoteTestUtilsV4.createNoteWithEngine({
          fname: "foo",
          vault: vaults[0],
          wsRoot,
          engine,
        });
        // Rewrite the file to have id missing in frontmatter
        const path = NoteUtils.getFullPath({ note, wsRoot });
        await writeFile(
          path,
          ["---", "updated: 234", "created: 123", "---"]
            .join("\n")
            .concat("\n".repeat(200))
        );

        const editor = await WSUtils.openNote(note);
        editor.revealRange(new vscode.Range(200, 0, 200, 0));
      });

      test("THEN still warns for frontmatter issues", async () => {
        const { allWarnings } = (await updateDecorations(
          VSCodeUtils.getActiveTextEditorOrThrow()
        ))!;
        expect(allWarnings!.length).toEqual(1);
        expect(
          AssertUtils.assertInString({
            body: allWarnings![0].message,
            match: ["id", "missing"],
          })
        );
      });

      runTestButSkipForWindows()("", () => {
        test("THEN don't warn for schemas", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const engine = ExtensionProvider.getEngine();
          const schema = (await engine.getSchema("root")).data!;
          const schemaFile = path.join(
            wsRoot,
            schema.vault.fsPath,
            `${schema.fname}.schema.yml`
          );
          const schemaURI = vscode.Uri.parse(schemaFile);
          const editor = await VSCodeUtils.openFileInEditor(schemaURI);

          const { allDecorations, allWarnings } = (await updateDecorations(
            editor!
          ))!;

          expect(allWarnings).toEqual(undefined);
          expect(allDecorations).toEqual(undefined);
        });
      });
    });
  });
});

// eslint-disable-next-line func-names
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

suite("GIVEN NoteReference", () => {
  const FNAME = "bar";
  describeMultiWS(
    "",
    {
      timeout: 10e10,
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: "withHeader",
          vault: vaults[0],
          wsRoot,
          body: "## ipsam adipisci",
        });
        await NoteTestUtilsV4.createNote({
          fname: FNAME,
          body: ["![[withHeader#ipsam-adipisci]]"].join("\n"),
          vault: vaults[0],
          wsRoot,
        });
      },
      modConfigCb: (config) => {
        config.dev = { enableExperimentalInlineNoteRef: true };
        return config;
      },
    },
    () => {
      test("THEN COMMENT is created for controller ", async () => {
        const { editor } = await getNote({ fname: FNAME });
        await updateDecorations(editor);
        const inlineNoteRefs =
          ExtensionProvider.getCommentThreadsState().inlineNoteRefs;
        const docKey =
          VSCodeUtils.getActiveTextEditor()!.document.uri.toString();
        const lastNoteRefThreadMap = inlineNoteRefs.get(docKey);
        expect(lastNoteRefThreadMap.size).toEqual(1);
      });
    }
  );
});
