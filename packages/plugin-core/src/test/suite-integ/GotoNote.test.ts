import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { NoteTestUtilsV4, NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import sinon from "sinon";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { GotoNoteCommand } from "../../commands/GotoNote";
import { PickerUtilsV2 } from "../../components/lookup/utils";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { GOTO_NOTE_PRESETS } from "../presets/GotoNotePreset";
import { getActiveEditorBasename } from "../testUtils";
import { expect, LocationTestUtils } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

const { ANCHOR_WITH_SPECIAL_CHARS, ANCHOR } = GOTO_NOTE_PRESETS;
suite("GotoNote", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("using args", () => {
    test("basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async ({ vaults }) => {
          const vault = vaults[0];
          const note = DendronWorkspace.instance().getEngine().notes["foo"];
          const { note: out } = (await new GotoNoteCommand().run({
            qs: "foo",
            vault,
          })) as { note: NoteProps };
          expect(out).toEqual(note);
          expect(getActiveEditorBasename()).toEqual("foo.md");
          done();
        },
      });
    });

    test("go to a stub ", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          const vpath = vault2Path({ vault, wsRoot });
          fs.removeSync(path.join(vpath, "foo.md"));
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[0];
          const ws = DendronWorkspace.instance();
          const engine = ws.getEngine();
          const note = NoteUtils.getNoteByFnameV5({
            fname: "foo",
            notes: engine.notes,
            vault,
            wsRoot: DendronWorkspace.wsRoot(),
          }) as NoteProps;
          expect(_.pick(note, ["fname", "stub"])).toEqual({
            fname: "foo",
            stub: true,
          });

          const { note: out } = (await new GotoNoteCommand().run({
            qs: "foo",
            vault,
          })) as { note: NoteProps };
          expect(_.pick(out, ["fname", "stub", "id"])).toEqual({
            fname: "foo",
            id: note.id,
          });
          expect(getActiveEditorBasename()).toEqual("foo.md");
          done();
        },
      });
    });

    test("go to new note", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async ({ vaults }) => {
          const vault = vaults[0];
          const { note: out } = (await new GotoNoteCommand().run({
            qs: "foo.ch2",
            vault,
          })) as { note: NoteProps };
          expect(_.pick(out, ["fname", "stub"])).toEqual({
            fname: "foo.ch2",
          });
          expect(getActiveEditorBasename()).toEqual("foo.ch2.md");
          done();
        },
      });
    });

    test("go to new note with template", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[0];
          await new GotoNoteCommand().run({
            qs: "bar.ch1",
            vault,
          });
          expect(getActiveEditorBasename()).toEqual("bar.ch1.md");
          const content =
            VSCodeUtils.getActiveTextEditor()?.document.getText() as string;
          expect(content.indexOf("ch1 template") >= 0).toBeTruthy();
          done();
        },
      });
    });

    test("go to note with anchor", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ANCHOR.preSetupHook(opts);
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[0];
          await new GotoNoteCommand().run({
            qs: "alpha",
            vault,
            anchor: {
              type: "header",
              value: "H3",
            },
          });
          expect(getActiveEditorBasename()).toEqual("alpha.md");
          const selection = VSCodeUtils.getActiveTextEditor()?.selection;
          expect(selection?.start.line).toEqual(9);
          expect(selection?.start.character).toEqual(0);
          done();
        },
      });
    });

    test("anchor with special chars", (done) => {
      let specialCharsHeader: string;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          ({ specialCharsHeader } =
            await ANCHOR_WITH_SPECIAL_CHARS.preSetupHook(opts));
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[0];
          await new GotoNoteCommand().run({
            qs: "alpha",
            vault,
            anchor: {
              type: "header",
              value: specialCharsHeader,
            },
          });
          expect(getActiveEditorBasename()).toEqual("alpha.md");
          const selection = VSCodeUtils.getActiveTextEditor()?.selection;
          expect(selection?.start.line).toEqual(9);
          expect(selection?.start.character).toEqual(0);
          done();
        },
      });
    });

    test("block anchor", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async ({ vaults }) => {
          const vault = vaults[0];
          await new GotoNoteCommand().run({
            qs: "anchor-target",
            vault,
            anchor: {
              type: "block",
              value: "block-id",
            },
          });
          expect(getActiveEditorBasename()).toEqual("anchor-target.md");
          const selection = VSCodeUtils.getActiveTextEditor()?.selection;
          expect(selection?.start.line).toEqual(10);
          expect(selection?.start.character).toEqual(0);
          done();
        },
      });
    });
  });

  describe("using selection", () => {
    test("xvault", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS_MULTI.setupLinksMulti(opts);
        },
        onInit: async ({ engine, vaults }) => {
          const note = engine.notes[NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname];
          const editor = await VSCodeUtils.openNote(note);
          const linkPos = LocationTestUtils.getPresetWikiLinkPosition();
          editor.selection = new vscode.Selection(linkPos, linkPos);
          // foo.ch1.md
          await new GotoNoteCommand().run({});
          const editor2 = VSCodeUtils.getActiveTextEditorOrThrow();
          const suffix =
            path.join(
              vaults[1].fsPath,
              NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.fname
            ) + ".md";
          expect(editor2.document.uri.fsPath.endsWith(suffix)).toBeTruthy();
          done();
        },
      });
    });

    test("xvault with multiple matches", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS_MULTI.setupLinksMulti(opts);
          await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
            vault: opts.vaults[2],
            wsRoot: opts.wsRoot,
            genRandomId: true,
          });
        },
        onInit: async ({ engine, vaults }) => {
          sinon
            .stub(PickerUtilsV2, "promptVault")
            .returns(Promise.resolve(vaults[1]));
          const note = engine.notes[NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname];
          const editor = await VSCodeUtils.openNote(note);
          const linkPos = LocationTestUtils.getPresetWikiLinkPosition();
          editor.selection = new vscode.Selection(linkPos, linkPos);
          await new GotoNoteCommand().run({});
          const editor2 = VSCodeUtils.getActiveTextEditorOrThrow();
          const suffix =
            path.join(
              vaults[1].fsPath,
              NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.fname
            ) + ".md";
          expect(editor2.document.uri.fsPath.endsWith(suffix)).toBeTruthy();
          done();
        },
      });
    });

    test("multi-link in same line", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
          const { wsRoot } = opts;
          const vault = opts.vaults[0];
          await NoteTestUtilsV4.modifyNoteByPath(
            { wsRoot, vault, fname: "foo" },
            (note) => {
              note.body =
                "this is a [[foolink]]. this is another link [[foo.ch1]]";
              return note;
            }
          );
        },
        onInit: async ({ engine, vaults }) => {
          const note = engine.notes["foo"];
          const editor = await VSCodeUtils.openNote(note);
          // put cursor in location on 48
          editor.selection = new vscode.Selection(
            new vscode.Position(7, 48),
            new vscode.Position(7, 48)
          );
          // foo.ch1.md
          await new GotoNoteCommand().run({
            vault: vaults[0],
          });
          expect(getActiveEditorBasename()).toEqual("foo.ch1.md");
          done();
        },
      });
    });
  });
});
