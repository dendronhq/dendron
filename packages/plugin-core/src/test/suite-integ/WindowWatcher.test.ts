import { ConfigUtils, VaultUtils, WorkspaceOpts } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WindowWatcher } from "../../windowWatcher";
import { WorkspaceWatcher } from "../../WorkspaceWatcher";
import { WSUtils } from "../../WSUtils";
import { MockDendronExtension } from "../MockDendronExtension";
import { MockPreviewProxy } from "../MockPreviewProxy";
import { expect } from "../testUtilsv2";
import {
  describeSingleWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

const setupBasic = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    fname: "bar",
    body: "bar body",
    vault: vaults[0],
    wsRoot,
  });
};

suite("WindowWatcher: GIVEN the dendron extension is running", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  let watcher: WindowWatcher | undefined;

  describe("WHEN onDidChangeActiveTextEditor is triggered", () => {
    describeSingleWS(
      "WHEN check decorator",
      {
        postSetupHook: setupBasic,
        ctx,
      },
      () => {
        test("decorators are updated", async () => {
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const mockExtension = new MockDendronExtension({
            engine: ExtensionProvider.getEngine(),
            wsRoot,
            context: ctx,
          });

          const previewProxy = new MockPreviewProxy();

          watcher = new WindowWatcher({
            extension: mockExtension,
            previewProxy,
          });
          const vaultPath = VaultUtils.getRelPath(vaults[0]);
          const notePath = path.join(wsRoot, vaultPath, "bar.md");
          const uri = vscode.Uri.file(notePath);
          const editor = await VSCodeUtils.openFileInEditor(uri);
          await watcher.triggerUpdateDecorations(editor!);
        });
      }
    );

    describeSingleWS(
      "AND WHEN automaticallyShowPreview is set to false",
      {
        postSetupHook: setupBasic,
        ctx,
        modConfigCb: (config) => {
          ConfigUtils.setPreviewProps(
            config,
            "automaticallyShowPreview",
            false
          );
          return config;
        },
      },
      () => {
        test("THEN preview panel is not shown", async () => {
          const mockExtension = new MockDendronExtension({
            engine: ExtensionProvider.getEngine(),
            wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
            vaults: ExtensionProvider.getDWorkspace().vaults,
            context: ctx,
          });

          const previewProxy: MockPreviewProxy = new MockPreviewProxy();

          const watcher = new WindowWatcher({
            extension: mockExtension,
            previewProxy,
          });

          watcher.activate();

          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const vaultPath = VaultUtils.getRelPath(vaults[0]);
          const notePath = path.join(wsRoot, vaultPath, "bar.md");
          const uri = vscode.Uri.file(notePath);
          await VSCodeUtils.openFileInEditor(uri);
          expect(previewProxy.isOpen()).toBeFalsy();
        });
      }
    );

    describeSingleWS(
      "AND WHEN automaticallyShowPreview is set to true",
      {
        postSetupHook: setupBasic,
        ctx,
        modConfigCb: (config) => {
          ConfigUtils.setPreviewProps(config, "automaticallyShowPreview", true);
          return config;
        },
      },
      () => {
        test("THEN preview panel is shown", async () => {
          const mockExtension = new MockDendronExtension({
            engine: ExtensionProvider.getEngine(),
            wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
            vaults: ExtensionProvider.getDWorkspace().vaults,
            context: ctx,
          });

          const previewProxy: MockPreviewProxy = new MockPreviewProxy();

          const watcher = new WindowWatcher({
            extension: mockExtension,
            previewProxy,
          });
          watcher.activate();

          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const vaultPath = VaultUtils.getRelPath(vaults[0]);
          const notePath = path.join(wsRoot, vaultPath, "bar.md");
          const uri = vscode.Uri.file(notePath);
          await VSCodeUtils.openFileInEditor(uri);
          const { onDidChangeActiveTextEditor } =
            watcher.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
          await onDidChangeActiveTextEditor(VSCodeUtils.getActiveTextEditor());

          expect(previewProxy.isOpen()).toBeTruthy();
        });
      }
    );
  });

  // NOTE: flaky tests
  describe.skip("focuses end of frontmatter", () => {
    function checkPosition(line: number) {
      const { selection } = VSCodeUtils.getSelection();
      expect(selection).toBeTruthy();
      expect(selection?.start.line).toEqual(line);
      expect(selection?.end.line).toEqual(line);
    }

    test("does when opening new note", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ vaults, engine }) => {
          // Try to make sure we're opening this for the first time
          await VSCodeUtils.closeAllEditors();
          const previewProxy = new MockPreviewProxy();
          const extension = ExtensionProvider.getExtension();

          const windowWatcher = new WindowWatcher({
            extension,
            previewProxy,
          });

          const workspaceWatcher = new WorkspaceWatcher({
            schemaSyncService:
              ExtensionProvider.getExtension().schemaSyncService,
            extension,
            windowWatcher,
          });
          workspaceWatcher.activate(ctx);
          watcher!.activate();
          // Open a note
          await WSUtils.openNote(
            (
              await engine.findNotesMeta({
                fname: "root",
                vault: vaults[0],
              })
            )[0]
          );
          // The selection should have been moved to after the frontmatter
          checkPosition(7);
          done();
        },
      });
    });

    test("does not when switching between open notes", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ vaults, engine }) => {
          // Try to make sure we're opening this for the first time
          await VSCodeUtils.closeAllEditors();

          const previewProxy = new MockPreviewProxy();
          const extension = ExtensionProvider.getExtension();

          const windowWatcher = new WindowWatcher({
            extension,
            previewProxy,
          });
          const workspaceWatcher = new WorkspaceWatcher({
            schemaSyncService:
              ExtensionProvider.getExtension().schemaSyncService,
            extension,
            windowWatcher,
          });

          workspaceWatcher.activate(ctx);

          watcher!.activate();
          // Open a note
          const first = (
            await engine.findNotesMeta({
              fname: "root",
              vault: vaults[0],
            })
          )[0];
          await WSUtils.openNote(first);
          checkPosition(7);
          // Move the selection so it's not where it has been auto-moved
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(
            new vscode.Position(3, 0),
            new vscode.Position(3, 0)
          );
          checkPosition(3);
          // Switch to another note
          const second = (
            await engine.findNotesMeta({
              fname: "root",
              vault: vaults[1],
            })
          )[0];
          await WSUtils.openNote(second);
          checkPosition(7);
          // Switch back to first note again
          await WSUtils.openNote(first);
          // The selection should not have moved
          checkPosition(3);
          done();
        },
      });
    });
  });
});
