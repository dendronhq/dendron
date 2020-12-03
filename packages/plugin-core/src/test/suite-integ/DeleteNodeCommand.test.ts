import { NoteChangeEntry } from "@dendronhq/common-all";
import {
  DirResult,
  EngineDeletePayload,
  tmpDir,
} from "@dendronhq/common-server";
import {
  NodeTestPresetsV2,
  NoteTestPresetsV2,
} from "@dendronhq/common-test-utils";
import assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { DeleteNodeCommand } from "../../commands/DeleteNodeCommand";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace } from "../testUtils";
import { setupBeforeAfter } from "../testUtilsV3";

const NOTE_DELETE_PRESET =
  NoteTestPresetsV2.presets.OneNoteOneSchemaPreset.delete;

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = tmpDir();
    },
  });

  test("basic", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      await new DeleteNodeCommand().execute();
      const vaultFiles = fs.readdirSync(vaultPath);
      const noteFiles = vaultFiles.filter((ent) => ent.endsWith(".md"));
      assert.strictEqual(noteFiles.length, 2);
      assert.deepStrictEqual(noteFiles.sort(), ["foo.ch1.md", "root.md"]);
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });

  test(NOTE_DELETE_PRESET.domainNoChildren.label, function (done) {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      const resp = await new DeleteNodeCommand().execute();
      const changed = (resp as EngineDeletePayload).data as NoteChangeEntry[];
      const notes = DendronWorkspace.instance().getEngine().notes;
      _.map(
        await NOTE_DELETE_PRESET.domainNoChildren.results({
          changed,
          vaultDir: vaultPath,
          notes,
        }),
        (ent) => {
          assert.deepStrictEqual(ent.expected, ent.actual);
        }
      );
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        fs.removeSync(path.join(vaultDir, "foo.ch1.md"));
      },
    });
  });

  test("basic", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      await new DeleteNodeCommand().execute();
      const vaultFiles = fs.readdirSync(vaultPath);
      const noteFiles = vaultFiles.filter((ent) => ent.endsWith(".md"));
      assert.strictEqual(noteFiles.length, 2);
      assert.deepStrictEqual(noteFiles.sort(), ["foo.ch1.md", "root.md"]);
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });
});

suite("schemas", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = tmpDir();
    },
  });

  test("basic", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.schema.yml");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      await new DeleteNodeCommand().execute();
      const vaultFiles = fs.readdirSync(vaultPath);
      const noteFiles = vaultFiles.filter((ent) => ent.endsWith(".schema.yml"));
      assert.strictEqual(
        DendronWorkspace.instance().getEngine().notes["foo"].schema,
        undefined
      );
      assert.strictEqual(noteFiles.length, 1);
      assert.deepStrictEqual(noteFiles.sort(), ["root.schema.yml"]);
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });
});
