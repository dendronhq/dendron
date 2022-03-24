import { ConfigUtils, NoteProps, VaultUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS, TestConfigUtils } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { CopyNoteLinkCommand } from "../../commands/CopyNoteLink";
import { VSCodeUtils } from "../../vsCodeUtils";
import {
  expect,
  LocationTestUtils,
  runMultiVaultTest,
  runSingleVaultTest,
} from "../testUtilsv2";
import { describeSingleWS, setupBeforeAfter } from "../testUtilsV3";
import fs from "fs-extra";
import { ExtensionProvider } from "../../ExtensionProvider";
import sinon from "sinon";

function openNote(note: NoteProps) {
  return ExtensionProvider.getExtension().wsUtils.openNote(note);
}

suite("CopyNoteLink", function () {
  const ctx = setupBeforeAfter(this, {});

  describe("single", () => {
    test("basic", (done) => {
      runSingleVaultTest({
        ctx,
        onInit: async ({ wsRoot, vault }) => {
          const notePath = path.join(vault2Path({ vault, wsRoot }), "foo.md");
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
          const link = (await new CopyNoteLinkCommand().run())?.link;
          expect(link).toEqual("[[Foo|foo]]");
          done();
        },
        preSetupHook: ENGINE_HOOKS.setupBasic,
      });
    });

    test("with a header that's a link", (done) => {
      let noteWithLink: NoteProps;
      runSingleVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          noteWithLink = await NoteTestUtilsV4.createNote({
            fname: "test",
            vault: vaults[0],
            wsRoot,
            body: "## [[Foo Bar|foo.bar]]",
          });
        },
        onInit: async () => {
          // Open and select the header
          const editor = await openNote(noteWithLink);
          const start = LocationTestUtils.getPresetWikiLinkPosition();
          const end = LocationTestUtils.getPresetWikiLinkPosition({ char: 10 });
          editor.selection = new vscode.Selection(start, end);
          // generate a wikilink for it
          const link = (await new CopyNoteLinkCommand().run())?.link;
          expect(link).toEqual(`[[Foo Bar|${noteWithLink.fname}#foo-bar]]`);
          done();
        },
      });
    });

    test("with a header link containing unicode characters", (done) => {
      let noteWithLink: NoteProps;
      runSingleVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          noteWithLink = await NoteTestUtilsV4.createNote({
            fname: "test",
            vault: vaults[0],
            wsRoot,
            body: "## Lörem [[Foo：Bar🙂Baz|foo：bar🙂baz]] Ipsum",
          });
        },
        onInit: async () => {
          // Open and select the header
          const editor = await openNote(noteWithLink);
          const start = LocationTestUtils.getPresetWikiLinkPosition();
          const end = LocationTestUtils.getPresetWikiLinkPosition({ char: 10 });
          editor.selection = new vscode.Selection(start, end);
          // generate a wikilink for it
          const link = (await new CopyNoteLinkCommand().run())?.link;
          expect(link).toEqual(
            `[[Lörem Foo：Bar🙂Baz Ipsum|test#lörem-foobarbaz-ipsum]]`
          );
          done();
        },
      });
    });

    test("with anchor", (done) => {
      let noteWithTarget: NoteProps;

      runSingleVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          noteWithTarget = await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create(
            {
              wsRoot,
              vault: vaults[0],
            }
          );
          await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async () => {
          const editor = await openNote(noteWithTarget);
          const pos = LocationTestUtils.getPresetWikiLinkPosition();
          const pos2 = LocationTestUtils.getPresetWikiLinkPosition({
            char: 12,
          });
          editor.selection = new vscode.Selection(pos, pos2);
          const link = (await new CopyNoteLinkCommand().run())?.link;
          expect(link).toEqual(`[[H1|${noteWithTarget.fname}#h1]]`);
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8, char: 12 })
          );
          const link2 = (await new CopyNoteLinkCommand().run())?.link;
          expect(link2).toEqual(`[[H2|${noteWithTarget.fname}#h2]]`);
          done();
        },
      });
    });

    test("existing block anchor", (done) => {
      let note: NoteProps;

      runSingleVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async () => {
          const editor = await openNote(note);
          const cmd = new CopyNoteLinkCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 10 })
          );
          const link = (await cmd.execute({})).link;
          const body = editor.document.getText();

          // check that the link looks like what we expect
          expect(link).toEqual("[[Anchor Target|anchor-target#^block-id]]");

          // should not have inserted any more anchors into the note
          AssertUtils.assertTimesInString({
            body,
            match: [[1, "^"]],
          });

          done();
        },
      });
    });

    test("doesn't confuse a footnote for a block anchor", (done) => {
      let note: NoteProps;

      runSingleVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NoteTestUtilsV4.createNote({
            fname: "test",
            vault: vaults[0],
            wsRoot,
            body: "Sapiente accusantium omnis quia. [^est]\n\n[^est]: Quia iure tempore eum.",
          });
        },
        onInit: async () => {
          const editor = await openNote(note);
          const cmd = new CopyNoteLinkCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition(),
            LocationTestUtils.getPresetWikiLinkPosition({ char: 10 })
          );
          const link = (await cmd.execute({})).link;
          const body = editor.document.getText();

          // check that the link looks like what we expect
          expect(link).toNotEqual("[[Test|test#^est]]");
          const anchor = getAnchorFromLink(link);

          // check that the anchor has been inserted into the note
          AssertUtils.assertTimesInString({
            body,
            match: [[1, anchor]],
          });

          done();
        },
      });
    });

    test("generated block anchor", (done) => {
      let note: NoteProps;

      runSingleVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async () => {
          const editor = await openNote(note);
          const cmd = new CopyNoteLinkCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 12, char: 12 })
          );
          const link = (await cmd.execute({})).link;
          const body = editor.document.getText();

          // check that the link looks like what we expect
          const anchor = getAnchorFromLink(link);

          // check that the anchor has been inserted into the note
          AssertUtils.assertTimesInString({
            body,
            match: [
              [1, anchor],
              [1, anchor],
            ],
          });

          done();
        },
      });
    });

    test("tag note", (done) => {
      let noteWithLink: NoteProps;
      runSingleVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          noteWithLink = await NoteTestUtilsV4.createNote({
            fname: "tags.foo.bar",
            vault: vaults[0],
            wsRoot,
            body: "## [[Foo Bar|foo.bar]]",
          });
        },
        onInit: async () => {
          // Open and select the header
          const editor = await openNote(noteWithLink);
          const start = LocationTestUtils.getPresetWikiLinkPosition();
          const end = LocationTestUtils.getPresetWikiLinkPosition({ char: 10 });
          editor.selection = new vscode.Selection(start, end);
          // generate a wikilink for it
          const link = (await new CopyNoteLinkCommand().run())?.link;
          expect(link).toEqual(`#foo.bar`);
          done();
        },
      });
    });
  });

  function getAnchorFromLink(link: string): string {
    const anchors = link.match(/\^[a-z0-9A-Z-_]+/g);
    expect(anchors).toBeTruthy();
    expect(anchors!.length).toEqual(1);
    expect(anchors![0].length > 0).toBeTruthy();
    return anchors![0];
  }

  describe("multi", () => {
    test("basic", (done) => {
      runMultiVaultTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setWorkspaceProp(
                config,
                "enableXVaultWikiLink",
                true
              );
              return config;
            },
            { wsRoot }
          );
          const notePath = path.join(
            vault2Path({ vault: vaults[0], wsRoot }),
            "foo.md"
          );
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
          const link = (await new CopyNoteLinkCommand().run())?.link;
          expect(link).toEqual("[[Foo|dendron://main/foo]]");
          done();
        },
        preSetupHook: ENGINE_HOOKS.setupBasic,
      });
    });

    test("with anchor", (done) => {
      let noteWithTarget: NoteProps;
      let noteWithAnchor: NoteProps;

      runMultiVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          noteWithTarget = await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create(
            {
              wsRoot,
              vault: vaults[0],
            }
          );
          noteWithAnchor = await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
            wsRoot,
            vault: vaults[1],
          });
        },
        onInit: async ({ wsRoot }) => {
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setWorkspaceProp(
                config,
                "enableXVaultWikiLink",
                true
              );
              return config;
            },
            { wsRoot }
          );

          const editor = await openNote(noteWithTarget);
          const pos = LocationTestUtils.getPresetWikiLinkPosition();
          const pos2 = LocationTestUtils.getPresetWikiLinkPosition({
            char: 12,
          });
          editor.selection = new vscode.Selection(pos, pos2);
          const link = (await new CopyNoteLinkCommand().run())?.link;
          expect(link).toEqual(
            `[[H1|dendron://main/${noteWithTarget.fname}#h1]]`
          );
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8, char: 12 })
          );
          const link2 = (await new CopyNoteLinkCommand().run())?.link;
          expect(link2).toEqual(
            `[[H2|dendron://main/${noteWithTarget.fname}#h2]]`
          );

          await openNote(noteWithAnchor);
          const link3 = (await new CopyNoteLinkCommand().run())?.link;
          expect(link3).toEqual(
            `[[Beta|dendron://other/${noteWithAnchor.fname}]]`
          );
          done();
        },
      });
    });

    test("existing block anchor", (done) => {
      let note: NoteProps;

      runMultiVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async ({ wsRoot }) => {
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setWorkspaceProp(
                config,
                "enableXVaultWikiLink",
                true
              );
              return config;
            },
            { wsRoot }
          );
          const editor = await openNote(note);
          const cmd = new CopyNoteLinkCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 10 })
          );
          const link = (await cmd.execute({})).link;
          const body = editor.document.getText();

          // check that the link looks like what we expect
          expect(link).toEqual(
            "[[Anchor Target|dendron://main/anchor-target#^block-id]]"
          );

          // should not have inserted any more anchors into the note
          AssertUtils.assertTimesInString({
            body,
            match: [[1, "^"]],
          });

          done();
        },
      });
    });

    test("generated block anchor", (done) => {
      let note: NoteProps;

      runMultiVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async ({ wsRoot }) => {
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setWorkspaceProp(
                config,
                "enableXVaultWikiLink",
                true
              );
              return config;
            },
            { wsRoot }
          );
          const editor = await openNote(note);
          const cmd = new CopyNoteLinkCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 12 })
          );
          const link = (await cmd.execute({})).link;
          const body = editor.document.getText();

          // check that the link looks like what we expect
          const anchor = getAnchorFromLink(link);
          expect(
            link.startsWith("[[Anchor Target|dendron://main/anchor-target#^")
          ).toBeTruthy();

          // check that the anchor has been inserted into the note
          AssertUtils.assertTimesInString({
            body,
            match: [[1, anchor]],
          });

          done();
        },
      });
    });
  });

  describeSingleWS("WHEN in a non-note file", { ctx }, () => {
    test("THEN creates a link to that file", async () => {
      const { wsRoot } = ExtensionProvider.getDWorkspace();
      const fsPath = path.join(wsRoot, "test.js");
      await fs.writeFile(
        fsPath,
        "const x = 'Pariatur officiis voluptatem molestiae.'"
      );
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
      const link = (await new CopyNoteLinkCommand().run())?.link;
      expect(link).toEqual("[[test.js]]");
    });

    describe("AND the file name starts with a dot", async () => {
      test("THEN creates a link to that file", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const fsPath = path.join(wsRoot, ".config.yaml");
        await fs.writeFile(fsPath, "x: 1");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
        const link = (await new CopyNoteLinkCommand().run())?.link;
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
        const link = (await new CopyNoteLinkCommand().run())?.link;
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
        const link = (await new CopyNoteLinkCommand().run())?.link;
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
        const link = (await new CopyNoteLinkCommand().run())?.link;
        expect(link).toEqual(path.join("[[src", "clj", "test.clj]]"));
      });
    });
  });

  describe("WHEN using selections in non-note files", () => {
    describeSingleWS(
      "AND there's an existing block anchor",
      {
        ctx,
        modConfigCb: (config) => {
          ConfigUtils.setNonNoteLinkAnchorType(config, "block");
          return config;
        },
      },
      () => {
        test("THEN creates a link to that file with a block anchor", async () => {
          await prepFileAndSelection(" ^my-block-anchor");
          const link = (await new CopyNoteLinkCommand().run())?.link;
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
        ctx,
        modConfigCb: (config) => {
          ConfigUtils.setNonNoteLinkAnchorType(config, "line");
          return config;
        },
      },
      () => {
        test("THEN creates a link to that file with a line anchor", async () => {
          await prepFileAndSelection();
          const link = (await new CopyNoteLinkCommand().run())?.link;
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
        ctx,
        modConfigCb: (config) => {
          ConfigUtils.setNonNoteLinkAnchorType(config, "block");
          return config;
        },
      },
      () => {
        test("THEN creates a link to that file with a block anchor", async () => {
          await prepFileAndSelection();
          const link = (await new CopyNoteLinkCommand().run())?.link;
          expect(
            await linkHasAnchor("block", ["src", "test.hs"], link)
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "AND config is set unset",
      {
        ctx,
      },
      () => {
        test("THEN creates a link to that file with a block anchor", async () => {
          await prepFileAndSelection();
          const link = (await new CopyNoteLinkCommand().run())?.link;
          expect(
            await linkHasAnchor("block", ["src", "test.hs"], link)
          ).toBeTruthy();
        });
      }
    );

    describe("AND config is set to prompt", () => {
      describeSingleWS(
        "AND user picks line in the prompt",
        {
          ctx,
          modConfigCb: (config) => {
            ConfigUtils.setNonNoteLinkAnchorType(config, "prompt");
            return config;
          },
        },
        () => {
          test("THEN generates a link anchor ", async () => {
            await prepFileAndSelection();
            const pick = sinon
              .stub(vscode.window, "showQuickPick")
              .resolves({ label: "line" });
            const link = (await new CopyNoteLinkCommand().run())?.link;
            expect(pick.calledOnce).toBeTruthy();
            expect(
              await linkHasAnchor("line", ["src", "test.hs"], link)
            ).toBeTruthy();
          });
        }
      );

      describeSingleWS(
        "AND user picks block in the prompt",
        {
          ctx,
          modConfigCb: (config) => {
            ConfigUtils.setNonNoteLinkAnchorType(config, "prompt");
            return config;
          },
        },
        () => {
          test("THEN generates a block anchor ", async () => {
            await prepFileAndSelection();
            const pick = sinon
              .stub(vscode.window, "showQuickPick")
              .resolves({ label: "block" });
            const link = (await new CopyNoteLinkCommand().run())?.link;
            expect(pick.calledOnce).toBeTruthy();
            expect(
              await linkHasAnchor("block", ["src", "test.hs"], link)
            ).toBeTruthy();
          });
        }
      );

      describeSingleWS(
        "AND user cancels the prompt",
        {
          ctx,
          modConfigCb: (config) => {
            ConfigUtils.setNonNoteLinkAnchorType(config, "prompt");
            return config;
          },
        },
        () => {
          test("THEN generates a line anchor ", async () => {
            await prepFileAndSelection();
            const pick = sinon
              .stub(vscode.window, "showQuickPick")
              .resolves(undefined);
            const link = (await new CopyNoteLinkCommand().run())?.link;
            expect(pick.calledOnce).toBeTruthy();
            expect(
              await linkHasAnchor("line", ["src", "test.hs"], link)
            ).toBeTruthy();
          });
        }
      );
    });
  });
});

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
