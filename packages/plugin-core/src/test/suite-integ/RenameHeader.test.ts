import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import _ from "lodash";
import { describe } from "mocha";
import { NoteUtils, NoteProps } from "@dendronhq/common-all";
import sinon from "sinon";
import * as vscode from "vscode";
import { RenameHeaderCommand } from "../../commands/RenameHeader";
import { VSCodeUtils } from "../../utils";
import { expect, LocationTestUtils } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { note2String } from "@dendronhq/common-server";

// TODO:
// In a reference range (start & end)

async function checkFile({
  note,
  wsRoot,
  match,
  nomatch,
}: {
  note: NoteProps;
  wsRoot: string;
  match?: string[];
  nomatch?: string[];
}) {
  const body = await note2String({ note, wsRoot });
  expect(
    await AssertUtils.assertInString({
      body,
      match,
      nomatch,
    })
  ).toBeTruthy();
}

suite("RenameNote", function () {
  const ctx = setupBeforeAfter(this, {});

  describe("using selection", () => {
    test("wikilink to other file", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "has-header",
            wsRoot,
            vault: vaults[0],
            body: "## Lorem ipsum dolor amet",
          });
          await NoteTestUtilsV4.createNote({
            fname: "has-link",
            wsRoot,
            vault: vaults[0],
            body: "[[has-header#lorem-ipsum-dolor-amet]]",
          });
        },
        onInit: async ({ engine, vaults, wsRoot }) => {
          const editor = await VSCodeUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand().run({});

            const afterRename = NoteUtils.getNoteByFnameV5({
              fname: "has-header",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = NoteUtils.getNoteByFnameV5({
              fname: "has-link",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRenameLink!.body,
                match: ["[[has-header#foo-bar]]"],
                nomatch: ["[[has-header#lorem-ipsum-dolor-amet]]"],
              })
            ).toBeTruthy();
            done();
          } finally {
            prompt.restore();
          }
        },
      });
    });

    test("wikilink to same file", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "has-link",
            wsRoot,
            vault: vaults[0],
            body: [
              "## Lorem ipsum dolor amet",
              "",
              "[[#lorem-ipsum-dolor-amet]]",
            ].join("\n"),
          });
        },
        onInit: async ({ engine, vaults, wsRoot }) => {
          const editor = await VSCodeUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand().run({});

            const afterRename = NoteUtils.getNoteByFnameV5({
              fname: "has-link",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            await checkFile({
              note: afterRename!,
              wsRoot,
              nomatch: [
                "Lorem",
                "ipsum",
                "dolor",
                "amet",
                "[[has-header#lorem-ipsum-dolor-amet]]",
              ],
              match: ["## Foo Bar", "[[#foo-bar]]"],
            });
            done();
          } finally {
            prompt.restore();
          }
        },
      });
    });

    test("with old header containing block anchor", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "has-header",
            wsRoot,
            vault: vaults[0],
            body: "## Lorem ipsum dolor amet ^anchor",
          });
          await NoteTestUtilsV4.createNote({
            fname: "has-link",
            wsRoot,
            vault: vaults[0],
            body: "[[has-header#lorem-ipsum-dolor-amet]]",
          });
        },
        onInit: async ({ engine, vaults, wsRoot }) => {
          const editor = await VSCodeUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand().run({});

            const afterRename = NoteUtils.getNoteByFnameV5({
              fname: "has-header",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar ^anchor"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = NoteUtils.getNoteByFnameV5({
              fname: "has-link",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRenameLink!.body,
                match: ["[[has-header#foo-bar]]"],
                nomatch: ["[[has-header#lorem-ipsum-dolor-amet]]"],
              })
            ).toBeTruthy();
            done();
          } finally {
            prompt.restore();
          }
        },
      });
    });

    test("with old header containing a wikilink", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "has-header",
            wsRoot,
            vault: vaults[0],
            body: "## Lorem ipsum [[dolor|note.dolor]] amet ^anchor",
          });
          await NoteTestUtilsV4.createNote({
            fname: "has-link",
            wsRoot,
            vault: vaults[0],
            body: "[[has-header#lorem-ipsum-dolor-amet]]",
          });
        },
        onInit: async ({ engine, vaults, wsRoot }) => {
          const editor = await VSCodeUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand().run({});

            const afterRename = NoteUtils.getNoteByFnameV5({
              fname: "has-header",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar ^anchor"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = NoteUtils.getNoteByFnameV5({
              fname: "has-link",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRenameLink!.body,
                match: ["[[has-header#foo-bar]]"],
                nomatch: ["[[has-header#lorem-ipsum-dolor-amet]]"],
              })
            ).toBeTruthy();
            done();
          } finally {
            prompt.restore();
          }
        },
      });
    });

    test("with new header containing a wikilink", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "has-header",
            wsRoot,
            vault: vaults[0],
            body: "## Lorem ipsum dolor amet ^anchor",
          });
          await NoteTestUtilsV4.createNote({
            fname: "has-link",
            wsRoot,
            vault: vaults[0],
            body: "[[has-header#lorem-ipsum-dolor-amet]]",
          });
        },
        onInit: async ({ engine, vaults, wsRoot }) => {
          const editor = await VSCodeUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo [[Bar|note.bar]] Baz"));
          try {
            await new RenameHeaderCommand().run({});

            const afterRename = NoteUtils.getNoteByFnameV5({
              fname: "has-header",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo [[Bar|note.bar]] Baz ^anchor"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = NoteUtils.getNoteByFnameV5({
              fname: "has-link",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRenameLink!.body,
                match: ["[[has-header#foo-bar-baz]]"],
                nomatch: ["[[has-header#lorem-ipsum-dolor-amet]]"],
              })
            ).toBeTruthy();
            done();
          } finally {
            prompt.restore();
          }
        },
      });
    });

    test("with a reference", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "has-header",
            wsRoot,
            vault: vaults[0],
            body: "## Lorem ipsum dolor amet",
          });
          await NoteTestUtilsV4.createNote({
            fname: "has-link",
            wsRoot,
            vault: vaults[0],
            body: "![[has-header#lorem-ipsum-dolor-amet]]",
          });
        },
        onInit: async ({ engine, vaults, wsRoot }) => {
          const editor = await VSCodeUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand().run({});

            const afterRename = NoteUtils.getNoteByFnameV5({
              fname: "has-header",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = NoteUtils.getNoteByFnameV5({
              fname: "has-link",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRenameLink!.body,
                match: ["![[has-header#foo-bar]]"],
                nomatch: ["![[has-header#lorem-ipsum-dolor-amet]]"],
              })
            ).toBeTruthy();
            done();
          } finally {
            prompt.restore();
          }
        },
      });
    });

    test("with a reference range, header at the start", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "has-header",
            wsRoot,
            vault: vaults[0],
            body: [
              "## Lorem ipsum dolor amet",
              "",
              "middle",
              "",
              "## end",
            ].join("\n"),
          });
          await NoteTestUtilsV4.createNote({
            fname: "has-link",
            wsRoot,
            vault: vaults[0],
            body: "![[has-header#lorem-ipsum-dolor-amet:#end]]",
          });
        },
        onInit: async ({ engine, vaults, wsRoot }) => {
          const editor = await VSCodeUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand().run({});

            const afterRename = NoteUtils.getNoteByFnameV5({
              fname: "has-header",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = NoteUtils.getNoteByFnameV5({
              fname: "has-link",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRenameLink!.body,
                match: ["![[has-header#foo-bar:#end]]"],
                nomatch: [
                  "![[has-header#lorem-ipsum-dolor-amet:#end]]",
                  "![[has-header#foo-bar]]",
                ],
              })
            ).toBeTruthy();
            done();
          } finally {
            prompt.restore();
          }
        },
      });
    });

    test("with a reference range, header at the end", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "has-header",
            wsRoot,
            vault: vaults[0],
            body: [
              "## start",
              "",
              "middle",
              "",
              "## Lorem Ipsum Dolor Amet",
            ].join("\n"),
          });
          await NoteTestUtilsV4.createNote({
            fname: "has-link",
            wsRoot,
            vault: vaults[0],
            body: "![[has-header#start:#lorem-ipsum-dolor-amet]]",
          });
        },
        onInit: async ({ engine, vaults, wsRoot }) => {
          const editor = await VSCodeUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
            line: 11,
          });

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand().run({});

            const afterRename = NoteUtils.getNoteByFnameV5({
              fname: "has-header",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = NoteUtils.getNoteByFnameV5({
              fname: "has-link",
              wsRoot,
              vault: vaults[0],
              notes: engine.notes,
            });
            expect(
              await AssertUtils.assertInString({
                body: afterRenameLink!.body,
                match: ["![[has-header#start:#foo-bar]]"],
                nomatch: [
                  "![[has-header#start:#lorem-ipsum-dolor-amet]]",
                  "![[has-header#foo-bar]]",
                  "![[has-header#start]]",
                ],
              })
            ).toBeTruthy();
            done();
          } finally {
            prompt.restore();
          }
        },
      });
    });
  });
});
