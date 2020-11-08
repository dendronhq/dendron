import { NoteUtilsV2 } from "@dendronhq/common-all";
import { DirResult, tmpDir, note2File } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import assert from "assert";
import { afterEach, beforeEach } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { GoToSiblingCommand } from "../../commands/GoToSiblingCommand";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  let direction = "next" as const;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  const createNotes = (vaultPath: string) => {
    return Promise.all([
      note2File(
        NoteUtilsV2.create({ fname: "foo.journal.2020.08.29" }),
        vaultPath
      ),
      note2File(
        NoteUtilsV2.create({ fname: "foo.journal.2020.08.30" }),
        vaultPath
      ),
      note2File(
        NoteUtilsV2.create({ fname: "foo.journal.2020.08.31" }),
        vaultPath
      ),
    ]);
  };

  test("basic", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.journal.2020.08.30.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      const resp = await new GoToSiblingCommand().execute({ direction });
      assert.deepStrictEqual(resp, { msg: "ok" });
      assert.ok(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
          "foo.journal.2020.08.31.md"
        )
      );
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        await createNotes(vaultDir);
      },
    });
  });

  test("traversal from parent", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.journal.2020.08.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      const resp = await new GoToSiblingCommand().execute({ direction });
      assert.deepStrictEqual(resp, { msg: "ok" });
      assert.ok(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
          "foo.journal.2020.09.md"
        )
      );
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        await createNotes(vaultDir);
        await note2File(
          NoteUtilsV2.create({ fname: "foo.journal.2020.08" }),
          vaultPath
        );
        await note2File(
          NoteUtilsV2.create({ fname: "foo.journal.2020.09" }),
          vaultPath
        );
      },
    });
  });

  test("go over index", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.journal.2020.08.31.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      const resp = await new GoToSiblingCommand().execute({ direction });
      assert.deepStrictEqual(resp, { msg: "ok" });
      assert.ok(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
          "foo.journal.2020.08.29.md"
        )
      );
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        await createNotes(vaultDir);
      },
    });
  });

  test("no siblings", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.journal.2020.08.29.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      const resp = await new GoToSiblingCommand().execute({ direction });
      assert.deepStrictEqual(resp, { msg: "no_siblings" });
      assert.ok(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
          "foo.journal.2020.08.29.md"
        )
      );
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        await note2File(
          NoteUtilsV2.create({ fname: "foo.journal.2020.08.29" }),
          vaultPath
        );
      },
    });
  });

  test("no open editor", (done) => {
    onWSInit(async () => {
      await VSCodeUtils.closeAllEditors();
      const resp = await new GoToSiblingCommand().execute({ direction });
      assert.deepStrictEqual(resp, { msg: "no_editor" });
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

  test("nav in root", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "root.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      const resp = await new GoToSiblingCommand().execute({ direction });
      assert.deepStrictEqual(resp, { msg: "ok" });
      assert.ok(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
          "foo.md"
        )
      );
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        // needed because traversal on root doesn't include root
        await note2File(NoteUtilsV2.create({ fname: "gamma" }), vaultPath);
      },
    });
  });
});
