import { NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { GotoNoteCommand } from "../../commands/GotoNote";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { GOTO_NOTE_PRESETS } from "../presets/GotoNotePreset";
import { getActiveEditorBasename } from "../testUtils";
import { expect, runSingleVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

const { ANCHOR_WITH_SPECIAL_CHARS, ANCHOR } = GOTO_NOTE_PRESETS;
suite("GotoNote", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });
  test("basic", (done) => {
    runSingleVaultTest({
      ctx,
      onInit: async ({ vault }) => {
        const note = DendronWorkspace.instance().getEngine().notes["foo"];
        const { note: out } = (await new GotoNoteCommand().run({
          qs: "foo",
          mode: "note",
          vault,
        })) as { note: NotePropsV2 };
        expect(out).toEqual(note);
        expect(getActiveEditorBasename()).toEqual("foo.md");
        done();
      },
    });
  });

  test("go to a stub ", (done) => {
    runSingleVaultTest({
      ctx,
      postSetupHook: async ({ vaults }) => {
        const vaultDir = vaults[0].fsPath;
        fs.removeSync(path.join(vaultDir, "foo.md"));
      },
      onInit: async ({ vault }) => {
        const ws = DendronWorkspace.instance();
        const engine = ws.getEngine();
        let note = NoteUtilsV2.getNoteByFnameV5({
          fname: "foo",
          notes: engine.notes,
          vault,
          wsRoot: DendronWorkspace.wsRoot(),
        }) as NotePropsV2;
        expect(_.pick(note, ["fname", "stub"])).toEqual({
          fname: "foo",
          stub: true,
        });

        const { note: out } = (await new GotoNoteCommand().run({
          qs: "foo",
          mode: "note",
          vault,
        })) as { note: NotePropsV2 };
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
    runSingleVaultTest({
      ctx,
      onInit: async ({ vault }) => {
        const { note: out } = (await new GotoNoteCommand().run({
          qs: "foo.ch2",
          mode: "note",
          vault,
        })) as { note: NotePropsV2 };
        expect(_.pick(out, ["fname", "stub"])).toEqual({
          fname: "foo.ch2"
        });
        expect(getActiveEditorBasename()).toEqual("foo.ch2.md");
        done();
      },
    });
  });

  test("go to new note with template", (done) => {
    runSingleVaultTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
      },
      onInit: async ({ vault }) => {
        await new GotoNoteCommand().run({
          qs: "bar.ch1",
          mode: "note",
          vault,
        });
        expect(getActiveEditorBasename()).toEqual("bar.ch1.md");
        const content = VSCodeUtils.getActiveTextEditor()?.document.getText() as string;
        expect(content.indexOf("ch1 template") >= 0).toBeTruthy();
        done();
      },
    });
  });

  test("go to note with anchor", (done) => {
    runSingleVaultTest({
      ctx,
      initDirCb: async (vaultDir) => {
        await ANCHOR.preSetupHook({
          wsRoot: "",
          vaults: [{ fsPath: vaultDir }],
        });
      },
      onInit: async ({ vault }) => {
        await new GotoNoteCommand().run({
          qs: "alpha",
          mode: "note",
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
    runSingleVaultTest({
      ctx,
      initDirCb: async (vaultDir) => {
        ({ specialCharsHeader } = await ANCHOR_WITH_SPECIAL_CHARS.preSetupHook({
          wsRoot: "",
          vaults: [{ fsPath: vaultDir }],
        }));
      },
      onInit: async ({ vault }) => {
        await new GotoNoteCommand().run({
          qs: "alpha",
          mode: "note",
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
});
