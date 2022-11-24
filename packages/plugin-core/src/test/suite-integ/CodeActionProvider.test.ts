import { ConfigUtils, NoteProps } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import * as vscode from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { EditorUtils } from "../../utils/EditorUtils";
import { WSUtils } from "../../WSUtils";
import { expect, LocationTestUtils } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

suite("Contextual UI Tests", function () {
  const ctx = setupBeforeAfter(this, {});
  describe("GIVEN only broken wikilink is selected in editor", () => {
    test("THEN code action for create new note is displayed", (done) => {
      let noteWithLink: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          noteWithLink = await NoteTestUtilsV4.createNote({
            fname: "test",
            vault: vaults[0],
            wsRoot,
            body: "[[foo.bar]]",
          });
        },
        onInit: async ({ engine }) => {
          const editor = await WSUtils.openNote(noteWithLink);
          const start = LocationTestUtils.getPresetWikiLinkPosition();
          const end = LocationTestUtils.getPresetWikiLinkPosition({ char: 10 });
          editor.selection = new vscode.Selection(start, end);
          expect(
            await EditorUtils.isBrokenWikilink({
              editor,
              selection: editor.selection,
              engine,
              note: noteWithLink,
            })
          ).toBeTruthy();
          done();
        },
      });
    });

    describe("AND selected link is a broken user tag", () => {
      test("THEN code action for create new note is displayed", (done) => {
        let noteWithLink: NoteProps;
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            noteWithLink = await NoteTestUtilsV4.createNote({
              fname: "test",
              vault: vaults[0],
              wsRoot,
              body: "@foo.bar",
            });
          },
          onInit: async ({ engine }) => {
            const editor = await WSUtils.openNote(noteWithLink);
            editor.selection = LocationTestUtils.getPresetWikiLinkSelection();
            expect(
              await EditorUtils.isBrokenWikilink({
                editor,
                selection: editor.selection,
                engine,
                note: noteWithLink,
              })
            ).toBeTruthy();
            done();
          },
        });
      });

      describe("AND user tags are disabled", () => {
        // TODO: fix test (ConfigService)
        test.skip("THEN code action for create new note is NOT displayed", (done) => {
          let noteWithLink: NoteProps;
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook: async ({ wsRoot, vaults }) => {
              noteWithLink = await NoteTestUtilsV4.createNote({
                fname: "test",
                vault: vaults[0],
                wsRoot,
                body: "@foo.bar",
              });
            },
            modConfigCb: (config) => {
              ConfigUtils.setWorkspaceProp(config, "enableUserTags", false);
              return config;
            },
            onInit: async ({ engine }) => {
              const editor = await WSUtils.openNote(noteWithLink);
              editor.selection = LocationTestUtils.getPresetWikiLinkSelection();
              expect(
                await EditorUtils.isBrokenWikilink({
                  editor,
                  selection: editor.selection,
                  engine,
                  note: noteWithLink,
                })
              ).toBeFalsy();
              done();
            },
          });
        });
      });
    });
  });

  let noteWithLink: NoteProps;
  describeMultiWS(
    "GIVEN header is selected in editor",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteWithLink = await NoteTestUtilsV4.createNote({
          fname: "test",
          vault: vaults[0],
          wsRoot,
          body: "## Welcome",
        });
      },
    },
    () => {
      test("THEN code action for rename header is displayed", async () => {
        const { engine } = ExtensionProvider.getDWorkspace();
        const editor = await WSUtils.openNote(noteWithLink);
        const start = new vscode.Position(7, 2);
        const end = new vscode.Position(7, 10);
        editor.selection = new vscode.Selection(start, end);
        expect(
          await EditorUtils.isBrokenWikilink({
            editor,
            selection: editor.selection,
            engine,
            note: noteWithLink,
          })
        ).toBeFalsy();
        expect(
          EditorUtils.getHeaderAt({
            document: editor.document,
            position: start,
          })
        ).toNotEqual(undefined);
      });
    }
  );

  describeMultiWS(
    "GIVEN some text is selected in editor",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteWithLink = await NoteTestUtilsV4.createNote({
          fname: "test",
          vault: vaults[0],
          wsRoot,
          body: "This is a root page",
        });
      },
    },
    () => {
      test("THEN code action for create note is displayed", async () => {
        const { engine } = ExtensionProvider.getDWorkspace();
        const editor = await WSUtils.openNote(noteWithLink);
        const start = new vscode.Position(7, 0);
        const end = new vscode.Position(7, 18);
        editor.selection = new vscode.Selection(start, end);
        expect(
          EditorUtils.getHeaderAt({
            document: editor.document,
            position: start,
          })
        ).toEqual(undefined);
        expect(
          await EditorUtils.isBrokenWikilink({
            editor,
            selection: editor.selection,
            engine,
            note: noteWithLink,
          })
        ).toBeFalsy();
      });
    }
  );
});
