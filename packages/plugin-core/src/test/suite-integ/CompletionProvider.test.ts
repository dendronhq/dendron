import {
  CONSTANTS,
  TAGS_HIERARCHY,
  USERS_HIERARCHY,
  VaultUtils,
} from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { before, describe } from "mocha";
import { CompletionItem, Position, Range } from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import {
  provideBlockCompletionItems,
  provideCompletionItems,
} from "../../features/completionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  runTestButSkipForWindows,
} from "../testUtilsV3";

suite("completionProvider", function () {
  describeMultiWS(
    "wikilink",
    {
      preSetupHook: async (opts) => {
        const { wsRoot, vaults } = opts;
        await NoteTestUtilsV4.createNote({
          fname: "test",
          vault: vaults[1],
          wsRoot,
        });
        await ENGINE_HOOKS.setupBasic(opts);
      },
    },
    () => {
      test("THEN provide completions", async () => {
        const { engine, vaults } = ExtensionProvider.getDWorkspace();
        // Open a note, add [[]]
        await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
          (
            await engine.findNotesMeta({
              fname: "root",
              vault: vaults[1],
            })
          )[0]
        );
        const editor = VSCodeUtils.getActiveTextEditorOrThrow();
        await editor.edit((editBuilder) => {
          editBuilder.insert(new Position(7, 0), "[[]]");
        });
        // have the completion provider complete this wikilink
        const compList = await provideCompletionItems(
          editor.document,
          new Position(7, 2)
        );
        expect(compList).toBeTruthy();
        // Suggested top level notes
        expect(compList!.items.length).toEqual(6);
        const results = await Promise.all(
          compList!.items.map(async (item) => {
            return engine.findNotesMeta({ fname: item.label as string });
          })
        );
        results.forEach((result) => {
          expect(result.length > 0).toBeTruthy();
        });
        // check that same vault items are sorted before other items
        const sortedItems = _.sortBy(
          compList?.items,
          (item) => item.sortText || item.label
        );
        const testIndex = _.findIndex(
          sortedItems,
          (item) => item.label === "test"
        );
        expect(testIndex !== -1 && testIndex < 2).toBeTruthy();
        // Check that xvault links were generated where needed, and only where needed.
        // Using root notes since they are in every vault.
        const rootItems = _.filter(
          compList?.items,
          (item) => item.label === "root"
        );
        for (const item of rootItems) {
          if (item.detail === VaultUtils.getName(vaults[1])) {
            // don't need an xvault link, should be a regular one
            expect(item.insertText).toEqual(item.label);
            expect(
              (item.insertText as string).startsWith(
                CONSTANTS.DENDRON_DELIMETER
              )
            ).toBeFalsy();
          } else {
            // does need an xvault link
            expect(
              (item.insertText as string).startsWith(
                CONSTANTS.DENDRON_DELIMETER
              )
            ).toBeTruthy();
          }
        }
      });
    }
  );

  describeMultiWS(
    "GIVEN hashtag",
    {
      preSetupHook: async (opts) => {
        const { wsRoot, vaults } = opts;
        await NoteTestUtilsV4.createNote({
          fname: "tags.foo",
          vault: vaults[1],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "tags.bar",
          vault: vaults[1],
          wsRoot,
        });
      },
    },
    () => {
      test("THEN provide correct completion", async () => {
        const { engine, vaults } = ExtensionProvider.getDWorkspace();
        // Open a note, add [[]]
        await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
          (
            await engine.findNotesMeta({
              fname: "root",
              vault: vaults[1],
            })
          )[0]
        );
        const editor = VSCodeUtils.getActiveTextEditorOrThrow();
        await editor.edit((editBuilder) => {
          editBuilder.insert(new Position(7, 0), "#");
        });
        // have the completion provider complete this wikilink
        const items = await provideCompletionItems(
          editor.document,
          new Position(7, 1)
        );
        expect(items).toBeTruthy();
        // Suggested all the notes
        expect(items!.items.length).toEqual(2);
        const results = await Promise.all(
          items!.items.map(async (item) => {
            return engine.findNotesMeta({
              fname: `${TAGS_HIERARCHY}${item.label}`,
            });
          })
        );
        results.forEach((result) => {
          expect(result.length > 0).toBeTruthy();
          expect(items?.items![0].insertText).toEqual("bar");
        });
      });
    }
  );

  describeMultiWS(
    "GIVEN hashtag that's in a sentence",
    {
      preSetupHook: async (opts) => {
        const { wsRoot, vaults } = opts;
        await NoteTestUtilsV4.createNote({
          fname: "tags.foo",
          vault: vaults[1],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "tags.bar",
          vault: vaults[1],
          wsRoot,
        });
      },
    },
    () => {
      test("THEN provide correct completions", async () => {
        const { vaults, engine } = ExtensionProvider.getDWorkspace();
        // Open a note, add [[]]
        await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
          (
            await engine.findNotesMeta({
              fname: "root",
              vault: vaults[1],
            })
          )[0]
        );
        const editor = VSCodeUtils.getActiveTextEditorOrThrow();
        await editor.edit((editBuilder) => {
          editBuilder.insert(new Position(7, 0), "Lorem ipsum #");
        });
        // have the completion provider complete this wikilink
        const compList = await provideCompletionItems(
          editor.document,
          new Position(7, 13)
        );
        const items = compList?.items;
        expect(items).toBeTruthy();
        // Suggested all the notes
        expect(items!.length).toEqual(2);
        const results = await Promise.all(
          items!.map(async (item) => {
            return engine.findNotesMeta({
              fname: `${TAGS_HIERARCHY}${item.label}`,
            });
          })
        );
        results.forEach((result) => {
          expect(result.length > 0).toBeTruthy();
        });
      });
    }
  );

  describeMultiWS(
    "user tag",
    {
      timeout: 10e6,
      preSetupHook: async (opts) => {
        const { wsRoot, vaults } = opts;
        await NoteTestUtilsV4.createNote({
          fname: "user.foo",
          vault: vaults[1],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "user.bar",
          vault: vaults[1],
          wsRoot,
        });
      },
    },
    () => {
      describe("WHEN only @ symbol", () => {
        test("THEN provide all completions", async () => {
          const { vaults, engine } = ExtensionProvider.getDWorkspace();
          await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
            (
              await engine.findNotesMeta({
                fname: "root",
                vault: vaults[1],
              })
            )[0]
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          await editor.edit((editBuilder) => {
            editBuilder.insert(new Position(7, 0), "@");
          });
          // have the completion provider complete this wikilink
          const compList = await provideCompletionItems(
            editor.document,
            new Position(7, 1)
          );
          const items = compList?.items;
          expect(items).toBeTruthy();
          // Suggested all the notes
          expect(items!.length).toEqual(2);
          const results = await Promise.all(
            items!.map(async (item) => {
              return engine.findNotesMeta({
                fname: `${USERS_HIERARCHY}${item.label}`,
              });
            })
          );
          results.forEach((result) => {
            expect(result.length > 0).toBeTruthy();
            expect(items![0].insertText).toEqual("bar");
          });
        });
      });

      describe("WHEN a few characters typed", () => {
        test("THEN provide specific completion", async () => {
          const { vaults, engine } = ExtensionProvider.getDWorkspace();
          await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
            (
              await engine.findNotesMeta({
                fname: "root",
                vault: vaults[1],
              })
            )[0]
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          await editor.edit((editBuilder) => {
            editBuilder.insert(new Position(7, 0), "@ba");
          });
          // have the completion provider complete this wikilink
          const compList = await provideCompletionItems(
            editor.document,
            new Position(7, 1)
          );
          const items = compList?.items;
          // Suggested all the notes
          expect(items!.length).toEqual(1);
          expect(items![0].insertText).toEqual("bar");
        });
      });
    }
  );

  describeMultiWS(
    "WHEN completing a wikilink without closing brackets",
    {},
    () => {
      let items: CompletionItem[] | undefined;
      before(async () => {
        const { vaults, engine } = ExtensionProvider.getDWorkspace();
        await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
          (
            await engine.findNotesMeta({
              fname: "root",
              vault: vaults[1],
            })
          )[0]
        );
        const editor = VSCodeUtils.getActiveTextEditorOrThrow();
        await editor.edit((editBuilder) => {
          editBuilder.insert(new Position(7, 0), "Commodi [[ nam");
        });
        const compList = await provideCompletionItems(
          editor.document,
          new Position(7, 10)
        );
        items = compList?.items;
      });

      test("THEN it finds completions", () => {
        expect(items?.length).toEqual(3);
      });

      test("THEN it doesn't erase any text following the wikilink", async () => {
        for (const item of items!) {
          const range = item.range! as Range;
          // Since there's no text, start and end of range is at the same place.
          // The end doesn't go over the following text to avoid deleting them, since those are not part of the wikilink.
          expect(range.start.character).toEqual(10);
          expect(range.end.character).toEqual(10);
        }
      });

      test("THEN it adds the closing brackets", async () => {
        for (const item of items!) {
          expect(item.insertText!.toString().endsWith("]]")).toBeTruthy();
        }
      });
    }
  );

  runTestButSkipForWindows()("blocks", () => {
    describeMultiWS(
      "",
      {
        preSetupHook: ENGINE_HOOKS.setupBasic,
      },
      () => {
        test("THEN doesn't provide outside wikilink", async () => {
          const { vaults, engine } = ExtensionProvider.getDWorkspace();
          // Open a note, add [[]]
          await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
            (
              await engine.findNotesMeta({
                fname: "root",
                vault: vaults[0],
              })
            )[0]
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          await editor.edit((editBuilder) => {
            editBuilder.insert(new Position(7, 0), "^");
          });
          // have the completion provider complete this wikilink
          const items = await provideBlockCompletionItems(
            editor.document,
            new Position(7, 1)
          );
          expect(items).toEqual(undefined);
        });
      }
    );

    describeMultiWS(
      "GIVEN paragraphs",
      {
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
      },
      () => {
        test("THEN provide correct completions", async () => {
          const { vaults, engine } = ExtensionProvider.getDWorkspace();
          // Open a note, add [[^]]
          await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
            (
              await engine.findNotesMeta({
                fname: "test",
                vault: vaults[0],
              })
            )[0]
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          await editor.edit((editBuilder) => {
            editBuilder.insert(new Position(7, 0), "[[^]]");
          });
          // have the completion provider complete this wikilink
          const items = await provideBlockCompletionItems(
            editor.document,
            new Position(7, 3)
          );
          expect(items).toBeTruthy();
          expect(items?.length).toEqual(3);
          // check that the
        });
      }
    );

    describeMultiWS(
      "GIVEN nested list",
      {
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
      },
      () => {
        test("THEN provide correct completions", async () => {
          const { vaults, engine } = ExtensionProvider.getDWorkspace();
          // Open a note, add [[^]]
          await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
            (
              await engine.findNotesMeta({
                fname: "test",
                vault: vaults[0],
              })
            )[0]
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          await editor.edit((editBuilder) => {
            editBuilder.insert(new Position(7, 0), "[[^]]");
          });
          // have the completion provider complete this wikilink
          const items = await provideBlockCompletionItems(
            editor.document,
            new Position(7, 3)
          );
          expect(items).toBeTruthy();
          expect(items?.length).toEqual(8);
        });
      }
    );

    // TODO: flaky
    test.skip("provides headers for other files", (done) => {
      runLegacyMultiWorkspaceTest({
        onInit: async ({ vaults, engine }) => {
          // Open a note, add [[test2#]]
          await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
            (
              await engine.findNotesMeta({
                fname: "test",
                vault: vaults[0],
              })
            )[0]
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          await editor.edit((editBuilder) => {
            editBuilder.insert(new Position(7, 0), "[[test2#]]");
          });
          // have the completion provider complete this wikilink
          const items = await provideBlockCompletionItems(
            editor.document,
            new Position(7, 3)
          );
          expect(items).toBeTruthy();
          expect(items?.length).toEqual(2);
          expect(items![0].insertText).toEqual("et-et-quam-culpa");
          expect(items![1].insertText).toEqual("quasi-ex-debitis-aut-sed");
          done();
        },
        preSetupHook: async ({ wsRoot, vaults }) => {
          NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "test2",
            body: [
              "## Et et quam culpa.",
              "",
              "* Cumque molestiae qui deleniti.",
              "* Eius odit commodi harum.",
              "  * Sequi ut non delectus tempore.",
              "  * In delectus quam sunt unde.",
              "",
              "## Quasi ex debitis aut sed.",
              "",
              "Perferendis officiis ut non.",
            ].join("\n"),
          });
          NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "test",
          });
        },
      });
    });

    describeMultiWS(
      "GIVEN other files with block anchors",
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "test2",
            body: [
              "Et et quam culpa.",
              "",
              "* Cumque molestiae qui deleniti.",
              "* Eius odit commodi harum. ^item-2",
              "  * Sequi ut non delectus tempore.",
              "  * In delectus quam sunt unde. ^item-4",
              "",
              "Quasi ex debitis aut sed.",
              "",
              "Perferendis officiis ut non. ^last-paragraph",
            ].join("\n"),
          });
          NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            fname: "test",
          });
        },
      },
      () => {
        test("THEN provide correct completions", async () => {
          const { vaults, engine } = ExtensionProvider.getDWorkspace();
          // Open a note, add [[test2#^]]
          await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
            (
              await engine.findNotesMeta({
                fname: "test",
                vault: vaults[0],
              })
            )[0]
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          await editor.edit((editBuilder) => {
            editBuilder.insert(new Position(7, 0), "[[test2#^]]");
          });
          // have the completion provider complete this wikilink
          const items = await provideBlockCompletionItems(
            editor.document,
            new Position(7, 3)
          );
          expect(items).toBeTruthy();
          expect(items?.length).toEqual(3);
          expect(items![0].insertText).toEqual("item-2");
          expect(items![1].insertText).toEqual("item-4");
          expect(items![2].insertText).toEqual("last-paragraph");
        });
      }
    );

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

    describeMultiWS(
      "",
      {
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
      },
      () => {
        test("THEN provide correct completions", async () => {
          const { vaults, engine } = ExtensionProvider.getDWorkspace();
          // Open a note, add [[^]]
          await new WSUtilsV2(ExtensionProvider.getExtension()).openNote(
            (
              await engine.findNotesMeta({
                fname: "test",
                vault: vaults[0],
              })
            )[0]
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          await editor.edit((editBuilder) => {
            editBuilder.insert(new Position(7, 0), "[[^]]");
          });
          // have the completion provider complete this wikilink
          const items = await provideBlockCompletionItems(
            editor.document,
            new Position(7, 3)
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
        });
      }
    );
  });
});
