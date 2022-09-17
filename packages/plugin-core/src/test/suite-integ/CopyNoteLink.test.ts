import {
  ConfigUtils,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
  testAssertsInsideCallback,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import { beforeEach, describe } from "mocha";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { CopyNoteLinkCommand } from "../../commands/CopyNoteLink";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect, LocationTestUtils } from "../testUtilsv2";
import { describeMultiWS, describeSingleWS } from "../testUtilsV3";

function openNote(note: NoteProps) {
  return ExtensionProvider.getExtension().wsUtils.openNote(note);
}

suite("CopyNoteLink", function () {
  // these tests can run long, set timeout to 5s
  this.timeout(5e5);
  let copyNoteLinkCommand: CopyNoteLinkCommand;
  beforeEach(() => {
    copyNoteLinkCommand = new CopyNoteLinkCommand(
      ExtensionProvider.getExtension()
    );
  });

  describeSingleWS(
    "GIVEN a basic setup on a single vault workspace",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("WHEN the editor is on a saved file, THEN CopyNoteLink should return link with title and fname of engine note", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const notePath = path.join(
          vault2Path({ vault: vaults[0], wsRoot }),
          "foo.md"
        );
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(link).toEqual("[[Foo|foo]]");
      });

      test("WHEN the editor is on a dirty file, THEN CopyNoteLink should return undefined and cause an onDidSaveTextDocument to be fired", (done) => {
        const { vaults } = ExtensionProvider.getDWorkspace();
        const testNote = NoteUtils.create({
          fname: "foo",
          vault: vaults[0],
        });
        // onEngineNoteStateChanged is not being triggered by save so test to make sure that save is being triggered instead
        const disposable = vscode.workspace.onDidSaveTextDocument(
          (textDocument) => {
            testAssertsInsideCallback(() => {
              expect(
                textDocument.getText().includes("id: barbar")
              ).toBeTruthy();
              disposable.dispose();
            }, done);
          }
        );

        ExtensionProvider.getWSUtils()
          .openNote(testNote)
          .then(async (editor) => {
            editor
              .edit(async (editBuilder) => {
                // Replace id of frontmatter
                const startPos = new vscode.Position(1, 4);
                const endPos = new vscode.Position(1, 7);

                editBuilder.replace(
                  new vscode.Range(startPos, endPos),
                  "barbar"
                );
              })
              .then(async () => {
                copyNoteLinkCommand.run();
              });
          });
      });

      test("WHEN the editor is selecting a header, THEN CopyNoteLink should return a link with that header", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const noteWithLink = await NoteTestUtilsV4.createNoteWithEngine({
          fname: "testHeader",
          vault: vaults[0],
          wsRoot,
          body: "## [[Foo Bar|foo.bar]]",
          engine,
        });
        // Open and select the header
        const editor = await openNote(noteWithLink);
        const start = LocationTestUtils.getPresetWikiLinkPosition();
        const end = LocationTestUtils.getPresetWikiLinkPosition({ char: 10 });
        editor.selection = new vscode.Selection(start, end);
        // generate a wikilink for it
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(link).toEqual(`[[Foo Bar|${noteWithLink.fname}#foo-bar]]`);
      });

      test("WHEN the editor is selecting a header with unicode characters, THEN CopyNoteLink should return a link with that header", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const noteWithLink = await NoteTestUtilsV4.createNoteWithEngine({
          fname: "testUnicode",
          vault: vaults[0],
          wsRoot,
          body: "## Lörem [[Foo：Bar🙂Baz|foo：bar🙂baz]] Ipsum",
          engine,
        });
        // Open and select the header
        const editor = await openNote(noteWithLink);
        const start = LocationTestUtils.getPresetWikiLinkPosition();
        const end = LocationTestUtils.getPresetWikiLinkPosition({ char: 10 });
        editor.selection = new vscode.Selection(start, end);
        // generate a wikilink for it
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(link).toEqual(
          `[[Lörem Foo：Bar🙂Baz Ipsum|testUnicode#lörem-foobarbaz-ipsum]]`
        );
      });

      test("WHEN the editor is selecting an anchor, THEN CopyNoteLink should return a link with that anchor", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const noteWithTarget =
          await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.createWithEngine({
            wsRoot,
            vault: vaults[0],
            engine,
          });
        await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.createWithEngine({
          wsRoot,
          vault: vaults[0],
          engine,
        });

        let editor = await openNote(noteWithTarget);
        const pos = LocationTestUtils.getPresetWikiLinkPosition();
        const pos2 = LocationTestUtils.getPresetWikiLinkPosition({
          char: 12,
        });
        editor.selection = new vscode.Selection(pos, pos2);
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(link).toEqual(`[[H1|${noteWithTarget.fname}#h1]]`);

        editor = await openNote(noteWithTarget);
        editor.selection = new vscode.Selection(
          LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
          LocationTestUtils.getPresetWikiLinkPosition({ line: 8, char: 12 })
        );
        const link2 = (await copyNoteLinkCommand.run())?.link;
        expect(link2).toEqual(`[[H2|${noteWithTarget.fname}#h2]]`);
      });

      test("WHEN the editor is selecting a block anchor, THEN CopyNoteLink should return a link with that block anchor", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const note =
          await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.createWithEngine({
            wsRoot,
            vault: vaults[0],
            engine,
          });

        const editor = await openNote(note);
        editor.selection = new vscode.Selection(
          LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }),
          LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 10 })
        );
        const link = (await copyNoteLinkCommand.execute({}))?.link;
        const body = editor.document.getText();

        // check that the link looks like what we expect
        expect(link).toEqual("[[Anchor Target|anchor-target#^block-id]]");

        // should not have inserted any more anchors into the note
        AssertUtils.assertTimesInString({
          body,
          match: [[1, "^"]],
        });
      });

      test("WHEN the editor is selecting a footnote, THEN CopyNoteLink should not confuse it for a block anchor", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const note = await NoteTestUtilsV4.createNoteWithEngine({
          fname: "testFootnote",
          vault: vaults[0],
          wsRoot,
          body: "Sapiente accusantium omnis quia. [^est]\n\n[^est]: Quia iure tempore eum.",
          engine,
        });

        const editor = await openNote(note);
        editor.selection = new vscode.Selection(
          LocationTestUtils.getPresetWikiLinkPosition(),
          LocationTestUtils.getPresetWikiLinkPosition({ char: 10 })
        );
        const link = (await copyNoteLinkCommand.execute({}))?.link;
        const body = editor.document.getText();

        // check that the link looks like what we expect
        expect(link).toNotEqual("[[testFootnote|testFootnote#^est]]");
        const anchor = getAnchorFromLink(link!);

        // check that the anchor has been inserted into the note
        await AssertUtils.assertTimesInString({
          body,
          match: [[1, anchor]],
        });
      });

      test("WHEN the note has a block anchor target, THEN CopyNoteLink should generate block anchor", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const note =
          await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.createWithEngine({
            wsRoot,
            vault: vaults[0],
            engine,
            fname: "generateBlockAnchorSingle",
          });

        const editor = await openNote(note);
        editor.selection = new vscode.Selection(
          LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
          LocationTestUtils.getPresetWikiLinkPosition({ line: 12, char: 12 })
        );
        const link = (await copyNoteLinkCommand.execute({}))?.link;
        const body = editor.document.getText();

        // check that the link looks like what we expect
        const anchor = getAnchorFromLink(link!);

        // check that the anchor has been inserted into the note
        await AssertUtils.assertTimesInString({
          body,
          match: [[1, anchor]],
        });
      });

      test("WHEN the editor is selecting a header of a tag note, THEN CopyNoteLink should return a link with that header", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const noteWithLink = await NoteTestUtilsV4.createNoteWithEngine({
          fname: "tags.foo.bar",
          vault: vaults[0],
          wsRoot,
          body: "## [[Foo Bar|foo.bar]]",
          engine,
        });

        const editor = await openNote(noteWithLink);
        const start = LocationTestUtils.getPresetWikiLinkPosition();
        const end = LocationTestUtils.getPresetWikiLinkPosition({ char: 10 });
        editor.selection = new vscode.Selection(start, end);
        // generate a wikilink for it
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(link).toEqual(`#foo.bar`);
      });
    }
  );

  describeSingleWS(
    "WHEN the alias mode is none, THEN CopyNoteLink should only return a link without a note alias",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
      modConfigCb: (config) => {
        ConfigUtils.setAliasMode(config, "none");
        return config;
      },
    },
    () => {
      test("THEN CopyNoteLink should only return a link without a note alias", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const notePath = path.join(
          vault2Path({ vault: vaults[0], wsRoot }),
          "foo.md"
        );
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(link).toEqual("[[foo]]");
      });
    }
  );

  describeMultiWS(
    "GIVEN a basic setup on a multivault workspace with enableXVaultWikiLink enabled",
    {
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(config, "enableXVaultWikiLink", true);
        return config;
      },
      postSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("WHEN the editor is on a saved file, THEN CopyNoteLink should return link with title and fname of engine note", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const notePath = path.join(
          vault2Path({ vault: vaults[0], wsRoot }),
          "foo.md"
        );
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(link).toEqual("[[Foo|dendron://vault1/foo]]");
      });

      test("WHEN the editor is on a dirty file, THEN CopyNoteLink should return undefined and cause an onDidSaveTextDocument to be fired", (done) => {
        const { vaults } = ExtensionProvider.getDWorkspace();
        const testNote = NoteUtils.create({
          fname: "foo",
          vault: vaults[0],
        });
        // onEngineNoteStateChanged is not being triggered by save so test to make sure that save is being triggered instead
        const disposable = vscode.workspace.onDidSaveTextDocument(
          (textDocument) => {
            testAssertsInsideCallback(() => {
              expect(
                textDocument.getText().includes("id: barbar")
              ).toBeTruthy();
              disposable.dispose();
            }, done);
          }
        );

        ExtensionProvider.getWSUtils()
          .openNote(testNote)
          .then(async (editor) => {
            editor
              .edit(async (editBuilder) => {
                // Replace id of frontmatter
                const startPos = new vscode.Position(1, 4);
                const endPos = new vscode.Position(1, 7);

                editBuilder.replace(
                  new vscode.Range(startPos, endPos),
                  "barbar"
                );
              })
              .then(async () => {
                copyNoteLinkCommand.run();
              });
          });
      });

      test("WHEN the editor is selecting an anchor, THEN CopyNoteLink should return a link with that anchor", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const noteWithTarget =
          await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.createWithEngine({
            wsRoot,
            vault: vaults[0],
            engine,
          });
        const noteWithAnchor =
          await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.createWithEngine({
            wsRoot,
            vault: vaults[1],
            engine,
          });

        let editor = await openNote(noteWithTarget);
        const pos = LocationTestUtils.getPresetWikiLinkPosition();
        const pos2 = LocationTestUtils.getPresetWikiLinkPosition({
          char: 12,
        });
        editor.selection = new vscode.Selection(pos, pos2);
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(link).toEqual(
          `[[H1|dendron://vault1/${noteWithTarget.fname}#h1]]`
        );

        editor = await openNote(noteWithTarget);
        editor.selection = new vscode.Selection(
          LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
          LocationTestUtils.getPresetWikiLinkPosition({ line: 8, char: 12 })
        );
        const link2 = (await copyNoteLinkCommand.run())?.link;
        expect(link2).toEqual(
          `[[H2|dendron://vault1/${noteWithTarget.fname}#h2]]`
        );

        await openNote(noteWithAnchor);
        const link3 = (await copyNoteLinkCommand.run())?.link;
        expect(link3).toEqual(
          `[[Beta|dendron://vault2/${noteWithAnchor.fname}]]`
        );
      });

      test("WHEN the editor is selecting a block anchor, THEN CopyNoteLink should return a link with that block anchor", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const note =
          await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.createWithEngine({
            wsRoot,
            vault: vaults[0],
            engine,
          });

        const editor = await openNote(note);
        editor.selection = new vscode.Selection(
          LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }),
          LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 10 })
        );
        const link = (await copyNoteLinkCommand.execute({}))?.link;
        const body = editor.document.getText();

        // check that the link looks like what we expect
        expect(link).toEqual(
          "[[Anchor Target|dendron://vault1/anchor-target#^block-id]]"
        );

        // should not have inserted any more anchors into the note
        AssertUtils.assertTimesInString({
          body,
          match: [[1, "^"]],
        });
      });

      test("WHEN the note has a block anchor target, THEN CopyNoteLink should generate block anchor", async () => {
        const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const note =
          await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.createWithEngine({
            wsRoot,
            vault: vaults[0],
            engine,
            fname: "generateBlockAnchorMulti",
          });

        const editor = await openNote(note);
        editor.selection = new vscode.Selection(
          LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }),
          LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 12 })
        );
        const link = (await copyNoteLinkCommand.execute({}))?.link;
        const body = editor.document.getText();

        // check that the link looks like what we expect
        const anchor = getAnchorFromLink(link!);
        expect(
          link!.startsWith(`[[${note.fname}|dendron://vault1/${note.fname}#^`)
        ).toBeTruthy();

        // check that the anchor has been inserted into the note
        AssertUtils.assertTimesInString({
          body,
          match: [[1, anchor]],
        });
      });
    }
  );

  describeSingleWS("WHEN in a non-note file", {}, () => {
    test("THEN creates a link to that file", async () => {
      const { wsRoot } = ExtensionProvider.getDWorkspace();
      const fsPath = path.join(wsRoot, "test.js");
      await fs.writeFile(
        fsPath,
        "const x = 'Pariatur officiis voluptatem molestiae.'"
      );
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
      const link = (await copyNoteLinkCommand.run())?.link;
      expect(link).toEqual("[[test.js]]");
    });

    describe("AND the file name starts with a dot", async () => {
      test("THEN creates a link to that file", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const fsPath = path.join(wsRoot, ".config.yaml");
        await fs.writeFile(fsPath, "x: 1");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(link).toEqual("[[.config.yaml]]");
      });
    });

    describe("AND the file is in assets", () => {
      test("THEN creates a link using assets", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const dirPath = path.join(
          wsRoot,
          VaultUtils.getRelPath(vaults[0]),
          "assets"
        );
        await fs.ensureDir(dirPath);
        const fsPath = path.join(dirPath, "test.py");
        await fs.writeFile(
          fsPath,
          "x = 'Pariatur officiis voluptatem molestiae.'"
        );
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(link).toEqual(path.join("[[assets", "test.py]]"));
      });
    });

    describe("AND the file is in a vault, but not in assets", () => {
      test("THEN creates a link from root", async () => {
        const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
        const vaultPath = VaultUtils.getRelPath(vaults[0]);
        const fsPath = path.join(path.join(wsRoot, vaultPath), "test.rs");
        await fs.writeFile(fsPath, "let x = 123;");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(link).toEqual(path.join(`[[${vaultPath}`, "test.rs]]"));
      });
    });

    describe("AND the file is in a nested folder", () => {
      test("THEN creates a link to that file", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const dirPath = path.join(wsRoot, "src", "clj");
        await fs.ensureDir(dirPath);
        const fsPath = path.join(dirPath, "test.clj");
        await fs.writeFile(fsPath, "(set! x 1)");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(link).toEqual(path.join("[[src", "clj", "test.clj]]"));
      });
    });
  });

  describe("WHEN using selections in non-note files", () => {
    describeSingleWS(
      "AND there's an existing block anchor",
      {
        modConfigCb: (config) => {
          ConfigUtils.setNonNoteLinkAnchorType(config, "block");
          return config;
        },
      },
      () => {
        test("THEN creates a link to that file with a block anchor", async () => {
          await prepFileAndSelection(" ^my-block-anchor");
          const link = (await copyNoteLinkCommand.run())?.link;
          expect(
            await linkHasAnchor(
              "block",
              ["src", "test.hs"],
              link,
              "^my-block-anchor"
            )
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "AND config is set to line anchor",
      {
        modConfigCb: (config) => {
          ConfigUtils.setNonNoteLinkAnchorType(config, "line");
          return config;
        },
      },
      () => {
        test("THEN creates a link to that file with a line anchor", async () => {
          await prepFileAndSelection();
          const link = (await copyNoteLinkCommand.run())?.link;
          // Link should contain an anchor
          expect(
            await linkHasAnchor("line", ["src", "test.hs"], link)
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "AND config is set to block anchor",
      {
        modConfigCb: (config) => {
          ConfigUtils.setNonNoteLinkAnchorType(config, "block");
          return config;
        },
      },
      () => {
        test("THEN creates a link to that file with a block anchor", async () => {
          await prepFileAndSelection();
          const link = (await copyNoteLinkCommand.run())?.link;
          expect(
            await linkHasAnchor("block", ["src", "test.hs"], link)
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS("AND config is set unset", {}, () => {
      test("THEN creates a link to that file with a block anchor", async () => {
        await prepFileAndSelection();
        const link = (await copyNoteLinkCommand.run())?.link;
        expect(
          await linkHasAnchor("block", ["src", "test.hs"], link)
        ).toBeTruthy();
      });
    });

    describeSingleWS(
      "GIVEN a workspace where config is set to prompt",
      {
        modConfigCb: (config) => {
          ConfigUtils.setNonNoteLinkAnchorType(config, "prompt");
          return config;
        },
      },
      () => {
        test("WHEN user picks line in the prompt, THEN CopyNoteLinkCommand generates a link anchor ", async () => {
          await prepFileAndSelection();
          const pick = sinon
            .stub(vscode.window, "showQuickPick")
            .resolves({ label: "line" });
          const link = (await copyNoteLinkCommand.run())?.link;
          expect(pick.calledOnce).toBeTruthy();
          expect(
            await linkHasAnchor("line", ["src", "test.hs"], link)
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "GIVEN a workspace where config is set to prompt",
      {
        modConfigCb: (config) => {
          ConfigUtils.setNonNoteLinkAnchorType(config, "prompt");
          return config;
        },
      },
      () => {
        test("WHEN user picks block in the prompt, THEN CopyNoteLinkCommand generates a block anchor ", async () => {
          await prepFileAndSelection();
          const pick = sinon
            .stub(vscode.window, "showQuickPick")
            .resolves({ label: "block" });
          const link = (await copyNoteLinkCommand.run())?.link;
          expect(pick.calledOnce).toBeTruthy();
          expect(
            await linkHasAnchor("block", ["src", "test.hs"], link)
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "GIVEN a workspace where config is set to prompt",
      {
        modConfigCb: (config) => {
          ConfigUtils.setNonNoteLinkAnchorType(config, "prompt");
          return config;
        },
      },
      () => {
        test("WHEN user cancels the prompt, THEN CopyNoteLinkCommand generates a line anchor ", async () => {
          await prepFileAndSelection();
          const pick = sinon
            .stub(vscode.window, "showQuickPick")
            .resolves(undefined);
          const link = (await copyNoteLinkCommand.run())?.link;
          expect(pick.calledOnce).toBeTruthy();
          expect(
            await linkHasAnchor("line", ["src", "test.hs"], link)
          ).toBeTruthy();
        });
      }
    );
  });
});

function getAnchorFromLink(link: string): string {
  const anchors = link.match(/\^[a-z0-9A-Z-_]+/g);
  expect(anchors).toBeTruthy();
  expect(anchors!.length).toEqual(1);
  expect(anchors![0].length > 0).toBeTruthy();
  return anchors![0];
}

async function prepFileAndSelection(appendText?: string) {
  const { wsRoot } = ExtensionProvider.getDWorkspace();
  const dirPath = path.join(wsRoot, "src");
  await fs.ensureDir(dirPath);
  const fsPath = path.join(dirPath, "test.hs");
  await fs.writeFile(
    fsPath,
    "fibs = 0 : 1 : zipWith (+) fibs (tail fibs)".concat(appendText || "")
  );
  await VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
  // Select a range
  VSCodeUtils.getActiveTextEditorOrThrow().selection = new vscode.Selection(
    0,
    0,
    0,
    10
  );
}

async function linkHasAnchor(
  type: "block" | "line",
  expectedPath: string[],
  link: string | undefined,
  expectedAnchor?: string
) {
  const { expected, unexpected } =
    type === "block"
      ? { expected: "^", unexpected: "L" }
      : { expected: "L", unexpected: "^" };
  expect(link).toBeTruthy();
  expect(
    await AssertUtils.assertInString({
      body: link!,
      match: [...expectedPath, `#${expected}`, "]]"],
      nomatch: [`#${unexpected}`],
    })
  ).toBeTruthy();
  // Get the anchor from `^` or `L` to `]]`
  const anchor = link!.slice(link!.indexOf(expected), -2);
  expect(anchor.length > 0).toBeTruthy();
  if (expectedAnchor) expect(anchor).toEqual(expectedAnchor);
  // The file should contain the matching anchor, if it's a block anchor
  if (type === "block")
    expect(
      await AssertUtils.assertInString({
        body: VSCodeUtils.getActiveTextEditorOrThrow().document.getText(),
        match: [anchor],
      })
    ).toBeTruthy();
  return true;
}
