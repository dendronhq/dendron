import { NoteProps } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
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
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  ctx = setupBeforeAfter(this, {});

  describe("single", function () {
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

    test("with anchor", function (done) {
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
          expect(link2).toEqual(`[[H2 ^8a|${noteWithTarget.fname}#h2]]`);
          done();
        },
      });
    });
  });

  describe("multi", function () {
    test("basic", (done) => {
      runMultiVaultTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
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

    test("with anchor", function (done) {
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
        onInit: async () => {
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
            `[[H2 ^8a|dendron://main/${noteWithTarget.fname}#h2-8a]]`
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
  });
});
