import {
  DendronError,
  DNodeUtilsV2,
  ENGINE_ERROR_CODES,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { DirResult, FileTestUtils, note2File } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
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
    root = FileTestUtils.tmpDir();
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

  test("change, no updated links", (done) => {
    onWSInit(async () => {
      await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(path.join(vaultDir, "foo.md"))
      );
      VSCodeUtils.showInputBox = async () => "bar";
      const changed = await new RenameNoteV2aCommand().run();
      assert.deepStrictEqual(changed, { changed: [] });
      assert.strictEqual(
        DNodeUtilsV2.fname(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
        ),
        "bar"
      );
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

  test("change, updated links", (done) => {
    onWSInit(async () => {
      await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(path.join(vaultDir, "foo.md"))
      );
      VSCodeUtils.showInputBox = async () => "foo2";
      const resp = await new RenameNoteV2aCommand().run();
      const note = DendronWorkspace.instance().getEngine().notes["bar"];
      assert.deepStrictEqual(resp?.changed.length, 1);
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
});
