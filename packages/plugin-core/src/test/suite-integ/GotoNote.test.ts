import { NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import assert from "assert";
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
import { runSingleVaultTest } from "../testUtilsv2";
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
        assert.deepStrictEqual(out, note);
        assert.strictEqual(getActiveEditorBasename(), "foo.md");
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
        let note = NoteUtilsV2.getNoteByFnameV4({
          fname: "foo",
          notes: engine.notes,
          vault,
        }) as NotePropsV2;
        assert.deepStrictEqual(_.pick(note, ["fname", "stub"]), {
          fname: "foo",
          stub: true,
        });

        const { note: out } = (await new GotoNoteCommand().run({
          qs: "foo",
          mode: "note",
          vault,
        })) as { note: NotePropsV2 };
        assert.deepStrictEqual(_.pick(out, ["fname", "stub", "id"]), {
          fname: "foo",
          id: note.id,
        });
        assert.strictEqual(getActiveEditorBasename(), "foo.md");
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
        assert.deepStrictEqual(_.pick(out, ["fname", "stub"]), {
          fname: "foo.ch2",
        });
        assert.strictEqual(getActiveEditorBasename(), "foo.ch2.md");
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
        assert.deepStrictEqual(getActiveEditorBasename(), "bar.ch1.md");
        const content = VSCodeUtils.getActiveTextEditor()?.document.getText() as string;
        assert.ok(content.indexOf("ch1 template") >= 0);
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
        assert.deepStrictEqual(getActiveEditorBasename(), "alpha.md");
        const selection = VSCodeUtils.getActiveTextEditor()?.selection;
        assert.strictEqual(selection?.start.line, 9);
        assert.strictEqual(selection?.start.character, 0);
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
        assert.deepStrictEqual(getActiveEditorBasename(), "alpha.md");
        const selection = VSCodeUtils.getActiveTextEditor()?.selection;
        assert.strictEqual(selection?.start.line, 9);
        assert.strictEqual(selection?.start.character, 0);
        done();
      },
    });
  });
});
