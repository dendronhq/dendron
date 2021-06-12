import { DVault } from "@dendronhq/common-all";
import { DirResult, tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
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
import _ from "lodash";

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

  test("with existing block anchor selection", (done) => {
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        vault = { fsPath: vaultDir };
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        const rootName = "bar";
        await NoteTestUtilsV4.createNote({
          fname: `${rootName}`,
          body: [
            "Sint est quis sint sed.",
            "Dicta vel nihil tempora. ^test-anchor",
            "",
            "A est alias unde quia quas.",
            "Laborum corrupti porro iure.",
            "",
            "Id perspiciatis est adipisci.",
          ].join("\n"),
          vault,
          props: {
            id: `${rootName}`,
          },
          wsRoot: "FAKE_ROOT",
        });
      },
    });
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "bar.md");
      const editor = (await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(notePath)
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(8, 0, 8, 0);
      const link = await new CopyNoteRefCommand().run();
      expect(link).toEqual("![[bar#^test-anchor]]");
      done();
    });
  });

  function getAnchorsFromLink(link: string, expectedCount?: number): string[] {
    const anchors = link.match(/\^[a-z0-9A-Z-_]+/g);
    expect(anchors).toBeTruthy();
    if (!_.isUndefined(expectedCount))
      expect(anchors!.length).toEqual(expectedCount);
    for (const anchor of anchors!) {
      expect(anchor.length > 0).toBeTruthy();
    }
    return anchors!;
  }

  test("with generated block anchors", (done) => {
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        vault = { fsPath: vaultDir };
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        const rootName = "bar";
        await NoteTestUtilsV4.createNote({
          fname: `${rootName}`,
          body: [
            "Sint est quis sint sed.",
            "Dicta vel nihil tempora. ^test-anchor",
            "",
            "A est alias unde quia quas.",
            "Laborum corrupti porro iure.",
            "",
            "Id perspiciatis est adipisci.",
          ].join("\n"),
          vault,
          props: {
            id: `${rootName}`,
          },
          wsRoot: "FAKE_ROOT",
        });
      },
    });
    onWSInit(async () => {
      const notePath = path.join(vaultPath, "bar.md");
      const editor = (await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(notePath)
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(8, 0, 11, 0);
      const link = await new CopyNoteRefCommand().run();

      // make sure the link is correct
      expect(link!.startsWith("![[bar#^test-anchor:#^"));
      expect(link!.endsWith("]]"));

      // make sure we only added 1 block anchor (there should be 2 now)
      AssertUtils.assertTimesInString({
        body: editor.document.getText(),
        match: [[2, /\^[a-zA-Z0-9-_]+/]],
      });

      // make sure the anchor in the link has been inserted into the document
      const anchor = getAnchorsFromLink(link!, 2)[1];
      AssertUtils.assertTimesInString({
        body: editor.document.getText(),
        match: [[1, anchor]],
      });
      done();
    });
  });
});
