import { NoteProps } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { AssertUtils, NoteTestUtilsV4, NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS, TestConfigUtils } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { CopyNoteLinkCommand } from "../../commands/CopyNoteLink";
import { VSCodeUtils } from "../../utils";
import { TIMEOUT } from "../testUtils";
import {
  expect,
  LocationTestUtils,
  runMultiVaultTest,
  runSingleVaultTest,
} from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("CopyNoteLink", function () {
  const ctx = setupBeforeAfter(this, {});
  this.timeout(TIMEOUT);

  describe("single", () => {
    test("basic", (done) => {
      runSingleVaultTest({
        ctx,
        onInit: async ({ wsRoot, vault }) => {
          const notePath = path.join(vault2Path({ vault, wsRoot }), "foo.md");
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
          const link = await new CopyNoteLinkCommand().run();
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
          const editor = await VSCodeUtils.openNote(noteWithLink);
          const start = LocationTestUtils.getPresetWikiLinkPosition();
          const end = LocationTestUtils.getPresetWikiLinkPosition({char: 10});
          editor.selection = new vscode.Selection(start, end);
          // generate a wikilink for it
          const link = await new CopyNoteLinkCommand().run();
          expect(link).toEqual(`[[Foo Bar|${noteWithLink.fname}#foo-bar]]`);
          done();
        }
      })
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
          const editor = await VSCodeUtils.openNote(noteWithTarget);
          const pos = LocationTestUtils.getPresetWikiLinkPosition();
          const pos2 = LocationTestUtils.getPresetWikiLinkPosition({
            char: 12,
          });
          editor.selection = new vscode.Selection(pos, pos2);
          const link = await new CopyNoteLinkCommand().run();
          expect(link).toEqual(`[[H1|${noteWithTarget.fname}#h1]]`);
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8, char: 12 })
          );
          const link2 = await new CopyNoteLinkCommand().run();
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
          const editor = await VSCodeUtils.openNote(note);
          const cmd = new CopyNoteLinkCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 10 })
          );
          const link = await cmd.execute({});
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
          const editor = await VSCodeUtils.openNote(note);
          const cmd = new CopyNoteLinkCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 12, char: 12 })
          );
          const link = await cmd.execute({});
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
              config.noXVaultWikiLink = false;
              return config;
            },
            { wsRoot }
          );
          const notePath = path.join(
            vault2Path({ vault: vaults[0], wsRoot }),
            "foo.md"
          );
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
          const link = await new CopyNoteLinkCommand().run();
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
              config.noXVaultWikiLink = false;
              return config;
            },
            { wsRoot }
          );

          const editor = await VSCodeUtils.openNote(noteWithTarget);
          const pos = LocationTestUtils.getPresetWikiLinkPosition();
          const pos2 = LocationTestUtils.getPresetWikiLinkPosition({
            char: 12,
          });
          editor.selection = new vscode.Selection(pos, pos2);
          const link = await new CopyNoteLinkCommand().run();
          expect(link).toEqual(
            `[[H1|dendron://main/${noteWithTarget.fname}#h1]]`
          );
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8, char: 12 })
          );
          const link2 = await new CopyNoteLinkCommand().run();
          expect(link2).toEqual(
            `[[H2|dendron://main/${noteWithTarget.fname}#h2]]`
          );

          await VSCodeUtils.openNote(noteWithAnchor);
          const link3 = await new CopyNoteLinkCommand().run();
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
              config.noXVaultWikiLink = false;
              return config;
            },
            { wsRoot }
          );
          const editor = await VSCodeUtils.openNote(note);
          const cmd = new CopyNoteLinkCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 10 })
          );
          const link = await cmd.execute({});
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
              config.noXVaultWikiLink = false;
              return config;
            },
            { wsRoot }
          );
          const editor = await VSCodeUtils.openNote(note);
          const cmd = new CopyNoteLinkCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 12 })
          );
          const link = await cmd.execute({});
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
});
