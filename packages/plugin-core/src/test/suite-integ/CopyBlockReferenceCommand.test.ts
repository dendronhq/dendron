import { AssertUtils, NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import { NoteProps } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { CopyBlockReferenceCommand } from "../../commands/CopyBlockReferenceCommand";
import { VSCodeUtils } from "../../utils";
import {
  expect,
  LocationTestUtils,
  runMultiVaultTest,
  runSingleVaultTest,
} from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("CopyBlockReferenceCommand", function () {
  const ctx = setupBeforeAfter(this);

  function getAnchorsFromLink(link: string, count: number): string[] {
    const anchors = link.match(/\^[a-z0-9A-Z-_]+/g);
    expect(anchors).toBeTruthy();
    expect(anchors!.length).toEqual(count);
    for (const anchor of anchors!) {
      expect(anchor.length > 1).toBeTruthy();
    }
    return anchors!;
  }

  describe("single-line", function () {
    test("single vault", function (done) {
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
          const cmd = new CopyBlockReferenceCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8, char: 12 })
          );
          const link = await cmd.execute();
          const body = editor.document.getText();

          // check that the link looks like what we expect
          const anchor = getAnchorsFromLink(link, 1)[0];

          // check that the anchor has been inserted into the note
          AssertUtils.assertTimesInString({
            body,
            match: [[1, anchor]],
          });

          done();
        },
      });
    });

    test("existing anchor", function (done) {
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
          const cmd = new CopyBlockReferenceCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 10 })
          );
          const link = await cmd.execute();
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

    test("multi vault", function (done) {
      let note: NoteProps;

      runMultiVaultTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          note = await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async () => {
          const editor = await VSCodeUtils.openNote(note);
          const cmd = new CopyBlockReferenceCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8, char: 12 })
          );
          const link = await cmd.execute();
          const body = editor.document.getText();

          // check that the link looks like what we expect
          const anchor = getAnchorsFromLink(link, 1)[0];
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

  describe("multi-line", function () {
    test("single vault", function (done) {
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
          const cmd = new CopyBlockReferenceCommand();
          editor.selection = new vscode.Selection(
            LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }),
            LocationTestUtils.getPresetWikiLinkPosition({ line: 12, char: 12 })
          );
          const link = await cmd.execute();
          const body = editor.document.getText();

          // check that the link looks like what we expect
          const anchors = getAnchorsFromLink(link, 2);

          // check that the anchor has been inserted into the note
          AssertUtils.assertTimesInString({
            body,
            match: [
              [1, anchors![0]],
              [1, anchors![1]],
            ],
          });

          done();
        },
      });
    });
  });
});
