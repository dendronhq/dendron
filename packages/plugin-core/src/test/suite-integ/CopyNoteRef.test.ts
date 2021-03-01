import { DVault, NoteUtilsV2 } from "@dendronhq/common-all";
import {
  DirResult,
  note2File,
  tmpDir,
  vault2Path,
} from "@dendronhq/common-server";
import { ENGINE_HOOKS, NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import assert from "assert";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { CopyNoteRefCommand } from "../../commands/CopyNoteRef";
import { VSCodeUtils } from "../../utils";
import { onWSInit, setupDendronWorkspace } from "../testUtils";
import { expect, runMultiVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("CopyNoteRef", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  let vault: DVault;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = tmpDir();
    },
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
          const link = await new CopyNoteRefCommand().run();
          expect(link).toEqual("![[dendron://main/foo]]");
          done();
        },
        preSetupHook: ENGINE_HOOKS.setupBasic,
      });
    });
  });

  test("basic", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "foo.md");
      await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
      const link = await new CopyNoteRefCommand().run();
      assert.deepStrictEqual(link, "![[foo]]");
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

  test("with selection", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "bar.md");
      const editor = (await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(notePath)
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(7, 0, 7, 12);
      const link = await new CopyNoteRefCommand().run();
      assert.equal(link, "![[bar#foo,1:#*]]");
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        vault = { fsPath: vaultDir };
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

  test("with partial selection", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "bar.md");
      const editor = (await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(notePath)
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(7, 0, 7, 4);
      const link = await new CopyNoteRefCommand().run();
      assert.equal(link, "![[bar#foo,1:#*]]");
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        vault = { fsPath: vaultDir };
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

  test("with selection and no next header", (done) => {
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "bar.md");
      const editor = (await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(notePath)
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(7, 0, 7, 12);
      const link = await new CopyNoteRefCommand().run();
      assert.equal(link, "![[bar#foo,1]]");
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        vault = { fsPath: vaultDir };
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        const rootName = "bar";
        const note = NoteUtilsV2.create({
          fname: `${rootName}`,
          id: `${rootName}`,
          created: "1",
          updated: "1",
          body: "## Foo\nfoo text\n",
          vault,
        });
        await note2File({ note, vault, wsRoot: "FAKE_ROOT" });
      },
    });
  });
});
