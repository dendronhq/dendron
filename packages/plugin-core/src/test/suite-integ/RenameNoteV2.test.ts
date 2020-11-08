import {
  DendronError,
  DNodeUtilsV2,
  ENGINE_ERROR_CODES,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { DirResult, tmpDir, note2File } from "@dendronhq/common-server";
import {
  NodeTestPresetsV2,
  RENAME_TEST_PRESETS,
} from "@dendronhq/common-test-utils";
import { ParserUtilsV2 } from "@dendronhq/engine-server";
import assert from "assert";
import { afterEach, beforeEach } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { RenameNoteV2aCommand } from "../../commands/RenameNoteV2a";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultDir: string;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("note exists", (done) => {
    onWSInit(async () => {
      try {
        await VSCodeUtils.openFileInEditor(
          vscode.Uri.file(path.join(vaultDir, "foo.ch1.md"))
        );
        await new RenameNoteV2aCommand().enrichInputs({ dest: "foo" });
      } catch (err) {
        assert.strictEqual(
          (err as DendronError).status,
          ENGINE_ERROR_CODES.NODE_EXISTS
        );
        done();
      }
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (_vaultDir) => {
        vaultDir = _vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });

  test("body update, no updated links", (done) => {
    onWSInit(async () => {
      await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(path.join(vaultDir, "foo.md"))
      );
      let active = VSCodeUtils.getActiveTextEditor() as vscode.TextEditor;
      await vscode.commands.executeCommand("cursorDown");
      await vscode.commands.executeCommand("cursorDown");
      await vscode.commands.executeCommand("cursorDown");
      await vscode.commands.executeCommand("cursorDown");
      await vscode.commands.executeCommand("cursorDown");
      await vscode.commands.executeCommand("cursorDown");
      await vscode.commands.executeCommand("cursorDown");
      await vscode.commands.executeCommand("cursorDown");
      await vscode.commands.executeCommand("cursorDown");
      await vscode.commands.executeCommand("type", { text: "hello" });
      await active.document.save();

      VSCodeUtils.showInputBox = async () => "bar";
      const resp = await new RenameNoteV2aCommand().run();
      assert.deepStrictEqual(resp?.changed?.length, 2);
      active = VSCodeUtils.getActiveTextEditor() as vscode.TextEditor;
      assert.strictEqual(DNodeUtilsV2.fname(active.document.uri.fsPath), "bar");
      assert.ok(active.document.getText().indexOf("hello") >= 0);
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (_vaultDir) => {
        vaultDir = _vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
          vaultDir,
        });
      },
    });
  });

  test("body update after open, no updated links", (done) => {
    onWSInit(async () => {
      await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(path.join(vaultDir, "foo.md"))
      );
      VSCodeUtils.showInputBox = async () => "bar";
      const resp = await new RenameNoteV2aCommand().run();
      assert.deepStrictEqual(resp?.changed?.length, 2);
      const active = VSCodeUtils.getActiveTextEditor() as vscode.TextEditor;
      assert.strictEqual(DNodeUtilsV2.fname(active.document.uri.fsPath), "bar");
      assert.ok(active.document.getText().indexOf("foo body") >= 0);
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (_vaultDir) => {
        vaultDir = _vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
          vaultDir,
        });
      },
    });
  });

  test("change, updated links", (done) => {
    onWSInit(async () => {
      await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(path.join(vaultDir, "foo.md"))
      );
      VSCodeUtils.showInputBox = async () => "foo2";
      const resp = await new RenameNoteV2aCommand().run();
      const note = DendronWorkspace.instance().getEngine().notes["bar"];
      assert.deepStrictEqual(resp?.changed.length, 3);
      assert.deepStrictEqual(resp?.changed[0]?.note, note);
      assert.strictEqual(
        DNodeUtilsV2.fname(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
        ),
        "foo2"
      );
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (_vaultDir) => {
        vaultDir = _vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        const bar = NoteUtilsV2.create({
          fname: `bar`,
          id: `bar`,
          body: "[[foo]]",
          updated: "1",
          created: "1",
        });
        await note2File(bar, vaultDir);
      },
    });
  });

  test(RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.label, (done) => {
    onWSInit(async () => {
      const engine = DendronWorkspace.instance().getEngine();
      await RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.before({ vaultDir });
      await engine.init();
      const {
        alpha,
        beta,
      } = await RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.after({
        vaultDir,
        findLinks: ParserUtilsV2.findLinks,
      });
      await engine.updateNote(alpha);
      await engine.writeNote(beta);
      const resp = await engine.renameNote({
        oldLoc: { fname: "beta", vault: { fsPath: vaultDir } },
        newLoc: { fname: "gamma", vault: { fsPath: vaultDir } },
      });
      const changed = resp.data;
      await NodeTestPresetsV2.runMochaHarness({
        opts: { changed, vaultDir } as Parameters<
          typeof RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.results
        >[0],
        results: RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.results,
      });
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (_vaultDir) => {
        vaultDir = _vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });
});
