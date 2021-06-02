import { DVault } from "@dendronhq/common-all";
import { DirResult, tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  NodeTestPresetsV2,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
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
      expect(link).toEqual("![[foo]]");
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
      expect(link).toEqual("![[bar#foo,1:#*]]");
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        vault = { fsPath: vaultDir };
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        const rootName = "bar";
        await NoteTestUtilsV4.createNote({
          fname: `${rootName}`,
          body: "## Foo\nfoo text\n## Header\n Header text",
          vault,
          props: {
            id: `${rootName}`,
          },
          wsRoot: "FAKE_ROOT",
        });
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
      expect(link).toEqual("![[bar#foo,1:#*]]");
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        vault = { fsPath: vaultDir };
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        const rootName = "bar";
        await NoteTestUtilsV4.createNote({
          fname: `${rootName}`,
          body: "## Foo\nfoo text\n## Header\n Header text",
          vault,
          props: {
            id: `${rootName}`,
          },
          wsRoot: "FAKE_ROOT",
        });
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
      expect(link).toEqual("![[bar#foo,1]]");
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        vault = { fsPath: vaultDir };
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        const rootName = "bar";
        await NoteTestUtilsV4.createNote({
          fname: `${rootName}`,
          body: "## Foo\nfoo text\n",
          vault,
          props: {
            id: `${rootName}`,
          },
          wsRoot: "FAKE_ROOT",
        });
      },
    });
  });
});
