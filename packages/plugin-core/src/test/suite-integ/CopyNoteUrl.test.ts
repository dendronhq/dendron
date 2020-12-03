import { NoteUtilsV2 } from "@dendronhq/common-all";
import { DirResult, note2File, tmpDir } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import assert from "assert";
import path from "path";
import * as vscode from "vscode";
import { CopyNoteURLCommand } from "../../commands/CopyNoteURL";
import { CONFIG } from "../../constants";
import { VSCodeUtils } from "../../utils";
import { onWSInit, setupDendronWorkspace } from "../testUtils";
import { setupBeforeAfter } from "../testUtilsV3";

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  let rootUrl = "dendron.so";

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = tmpDir();
    },
  });

  test("with override", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      const link = await new CopyNoteURLCommand().run();
      const url = path.join(rootUrl, "notes", "foo.html");
      assert.strictEqual(link, url);
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      configOverride: {
        [CONFIG.COPY_NOTE_URL_ROOT.key]: rootUrl,
      },
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });

  test("with selection and override", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "bar.md");
      const editor = (await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(notePath)
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(7, 0, 7, 12);
      const link = await new CopyNoteURLCommand().run();
      const url = path.join(rootUrl, "notes", "bar.html#foo");
      assert.strictEqual(link, url);
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      configOverride: {
        [CONFIG.COPY_NOTE_URL_ROOT.key]: rootUrl,
      },
      useCb: async (vaultDir) => {
        const vault = { fsPath: vaultDir };
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        const rootName = "bar";
        const note = NoteUtilsV2.create({
          fname: `${rootName}`,
          id: `${rootName}`,
          created: "1",
          updated: "1",
          body: "## Foo\nfoo text\n## Header\n Header text",
          vault,
        });
        await note2File({ note, vault, wsRoot: "FAKE_ROOT" });
      },
    });
  });
});
