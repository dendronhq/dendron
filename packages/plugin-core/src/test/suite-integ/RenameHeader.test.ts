import { NoteProps } from "@dendronhq/common-all";
import { note2String } from "@dendronhq/common-server";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { beforeEach, afterEach, describe } from "mocha";
import sinon from "sinon";
import * as vscode from "vscode";
import {
  RenameHeaderCommand,
  CommandOutput,
} from "../../commands/RenameHeader";
import { ExtensionProvider } from "../../ExtensionProvider";
import { WSUtils } from "../../WSUtils";
import { expect, LocationTestUtils } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

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

  let target: NoteProps;
  describeMultiWS(
    "GIVEN a note, and another note that references it",
    {
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        target = await NoteTestUtilsV4.createNote({
          fname: "target",
          wsRoot,
          vault: vaults[0],
          body: "## header\n\n## dummy",
        });
        await NoteTestUtilsV4.createNote({
          fname: "note-with-link-to-target",
          wsRoot,
          vault: vaults[0],
          body: "[[target]]",
        });
        await NoteTestUtilsV4.createNote({
          fname: "another-note-with-link-to-target",
          wsRoot,
          vault: vaults[0],
          body: "[[target#dummy]]",
        });
      },
    },
    () => {
      let sandbox: sinon.SinonSandbox;
      beforeEach(() => {
        sandbox = sinon.createSandbox();
      });

      afterEach(() => {
        sandbox.restore();
      });

      test("THEN, if the reference isn't pointing to the header being renamed, the note that is referencing isn't updated.", async () => {
        const editor = await WSUtils.openNote(target);
        editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

        sandbox
          .stub(vscode.window, "showInputBox")
          .returns(Promise.resolve("Foo Bar"));
        const out = (await new RenameHeaderCommand(
          ExtensionProvider.getExtension()
        ).run({})) as CommandOutput;

        const updateResps = out!.data?.filter((resp) => {
          return resp.status === "update";
        });
        // Only target note should be updated
        expect(updateResps?.length).toEqual(1);
        expect(updateResps![0].note.fname).toEqual("target");
      });
    }
  );

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
        onInit: async ({ engine, vaults }) => {
          const editor = await WSUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand(ExtensionProvider.getExtension()).run(
              {}
            );

            const afterRename = (
              await engine.findNotes({ fname: "has-header", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = (
              await engine.findNotes({ fname: "has-link", vault: vaults[0] })
            )[0];
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

    test("updates default alias", (done) => {
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
            body: "[[Lorem ipsum dolor amet|has-header#lorem-ipsum-dolor-amet]]",
          });
        },
        onInit: async ({ engine, vaults }) => {
          const editor = await WSUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand(ExtensionProvider.getExtension()).run(
              {}
            );

            const afterRename = (
              await engine.findNotes({ fname: "has-header", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = (
              await engine.findNotes({ fname: "has-link", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRenameLink!.body,
                match: ["[[Foo Bar|has-header#foo-bar]]"],
                nomatch: [
                  "[[Lorem ipsum dolor amet|has-header#lorem-ipsum-dolor-amet]]",
                  "[[has-header#foo-bar]]",
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

    test("does not rename a wikilink to another header", (done) => {
      let note: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "has-header",
            wsRoot,
            vault: vaults[0],
            body: "## Lorem ipsum dolor amet\n\n## Maxime Distinctio Officia",
          });
          await NoteTestUtilsV4.createNote({
            fname: "has-link",
            wsRoot,
            vault: vaults[0],
            body: "[[has-header#maxime-distinctio-officia]]",
          });
        },
        onInit: async ({ engine, vaults }) => {
          const editor = await WSUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand(ExtensionProvider.getExtension()).run(
              {}
            );

            const afterRename = (
              await engine.findNotes({ fname: "has-header", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar", "## Maxime Distinctio Officia"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = (
              await engine.findNotes({ fname: "has-link", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRenameLink!.body,
                match: ["[[has-header#maxime-distinctio-officia]]"],
                nomatch: ["[[has-header#foo-bar]]"],
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
          const editor = await WSUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand(ExtensionProvider.getExtension()).run(
              {}
            );

            const afterRename = (
              await engine.findNotes({ fname: "has-link", vault: vaults[0] })
            )[0];
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
        onInit: async ({ engine, vaults }) => {
          const editor = await WSUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand(ExtensionProvider.getExtension()).run(
              {}
            );

            const afterRename = (
              await engine.findNotes({ fname: "has-header", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar ^anchor"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = (
              await engine.findNotes({ fname: "has-link", vault: vaults[0] })
            )[0];
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
        onInit: async ({ engine, vaults }) => {
          const editor = await WSUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand(ExtensionProvider.getExtension()).run(
              {}
            );

            const afterRename = (
              await engine.findNotes({ fname: "has-header", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar ^anchor"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = (
              await engine.findNotes({ fname: "has-link", vault: vaults[0] })
            )[0];
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
        onInit: async ({ engine, vaults }) => {
          const editor = await WSUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo [[Bar|note.bar]] Baz"));
          try {
            await new RenameHeaderCommand(ExtensionProvider.getExtension()).run(
              {}
            );

            const afterRename = (
              await engine.findNotes({ fname: "has-header", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo [[Bar|note.bar]] Baz ^anchor"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = (
              await engine.findNotes({ fname: "has-link", vault: vaults[0] })
            )[0];
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
        onInit: async ({ engine, vaults }) => {
          const editor = await WSUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand(ExtensionProvider.getExtension()).run(
              {}
            );

            const afterRename = (
              await engine.findNotes({ fname: "has-header", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = (
              await engine.findNotes({ fname: "has-link", vault: vaults[0] })
            )[0];
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
        onInit: async ({ engine, vaults }) => {
          const editor = await WSUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand(ExtensionProvider.getExtension()).run(
              {}
            );

            const afterRename = (
              await engine.findNotes({ fname: "has-header", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = (
              await engine.findNotes({ fname: "has-link", vault: vaults[0] })
            )[0];
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
        onInit: async ({ engine, vaults }) => {
          const editor = await WSUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
            line: 11,
          });

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand(ExtensionProvider.getExtension()).run(
              {}
            );

            const afterRename = (
              await engine.findNotes({ fname: "has-header", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = (
              await engine.findNotes({ fname: "has-link", vault: vaults[0] })
            )[0];
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

    test("does not rename a reference range to another header", (done) => {
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
              "## Maxime Distinctio Officia",
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
            body: "![[has-header#maxime-distinctio-officia:#end]]",
          });
        },
        onInit: async ({ engine, vaults }) => {
          const editor = await WSUtils.openNote(note);
          editor.selection = LocationTestUtils.getPresetWikiLinkSelection();

          const prompt = sinon
            .stub(vscode.window, "showInputBox")
            .returns(Promise.resolve("Foo Bar"));
          try {
            await new RenameHeaderCommand(ExtensionProvider.getExtension()).run(
              {}
            );

            const afterRename = (
              await engine.findNotes({ fname: "has-header", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRename!.body,
                match: ["## Foo Bar"],
                nomatch: ["Lorem", "ipsum", "dolor", "amet"],
              })
            ).toBeTruthy();
            const afterRenameLink = (
              await engine.findNotes({ fname: "has-link", vault: vaults[0] })
            )[0];
            expect(
              await AssertUtils.assertInString({
                body: afterRenameLink!.body,
                match: ["![[has-header#maxime-distinctio-officia:#end]]"],
                nomatch: [
                  "![[has-header#foo-bar:#end]]",
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
  });
});
