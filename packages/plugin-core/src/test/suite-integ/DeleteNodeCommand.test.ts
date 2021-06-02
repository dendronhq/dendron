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
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { DeleteNodeCommand } from "../../commands/DeleteNodeCommand";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace } from "../testUtils";
import { expect } from "../testUtilsv2";
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
      expect(noteFiles.length).toEqual(2);
      expect(noteFiles.sort()).toEqual(["foo.ch1.md", "root.md"]);
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
          expect(ent.expected).toEqual(ent.actual);
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
      expect(noteFiles.length).toEqual(2);
      expect(noteFiles.sort()).toEqual(["foo.ch1.md", "root.md"]);
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
      expect(
        DendronWorkspace.instance().getEngine().notes["foo"].schema
      ).toEqual(undefined);
      expect(noteFiles.length).toEqual(1);
      expect(noteFiles.sort()).toEqual(["root.schema.yml"]);
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
