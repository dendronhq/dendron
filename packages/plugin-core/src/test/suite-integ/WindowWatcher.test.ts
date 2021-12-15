import { ConfigUtils, NoteUtils, WorkspaceOpts } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { PreviewPanelFactory } from "../../components/views/PreviewViewFactory";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WindowWatcher } from "../../windowWatcher";
import { getDWorkspace, getExtension } from "../../workspace";
import { WorkspaceWatcher } from "../../WorkspaceWatcher";
import { WSUtils } from "../../WSUtils";
import { expect, runSingleVaultTest } from "../testUtilsv2";
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
  const watcher: WindowWatcher = new WindowWatcher(
    PreviewPanelFactory.getProxy()
  );

  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("WHEN onDidChangeActiveTextEditor is triggered", () => {
    test("basic", (done) => {
      runSingleVaultTest({
        ctx,
        postSetupHook: setupBasic,
        onInit: async ({ vault, wsRoot }) => {
          const vaultPath = vault.fsPath;
          const notePath = path.join(wsRoot, vaultPath, "bar.md");
          const uri = vscode.Uri.file(notePath);
          const editor = await VSCodeUtils.openFileInEditor(uri);
          await watcher.triggerUpdateDecorations(editor!);
          // TODO: check for decorations
          done();
        },
      });
    });

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
          const { wsRoot, vaults } = getDWorkspace();
          const vaultPath = vaults[0].fsPath;
          const notePath = path.join(wsRoot, vaultPath, "bar.md");
          const uri = vscode.Uri.file(notePath);
          const editor = await VSCodeUtils.openFileInEditor(uri);
          await watcher.triggerNotePreviewUpdate(editor!);

          const maybePanel = PreviewPanelFactory.getProxy().getPanel();
          expect(maybePanel).toBeFalsy();
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
          const { wsRoot, vaults } = getDWorkspace();
          const vaultPath = vaults[0].fsPath;
          const notePath = path.join(wsRoot, vaultPath, "bar.md");
          const uri = vscode.Uri.file(notePath);
          const editor = await VSCodeUtils.openFileInEditor(uri);
          await watcher.triggerNotePreviewUpdate(editor!);

          const maybePanel = PreviewPanelFactory.getProxy().getPanel();
          expect(maybePanel).toBeTruthy();
          expect(maybePanel?.active).toBeTruthy();
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
        onInit: async ({ vaults, wsRoot, engine }) => {
          // Try to make sure we're opening this for the first time
          await VSCodeUtils.closeAllEditors();

          getExtension().workspaceWatcher = new WorkspaceWatcher();
          getExtension().workspaceWatcher?.activate(ctx);
          watcher.activate(ctx);
          // Open a note
          await WSUtils.openNote(
            NoteUtils.getNoteByFnameV5({
              vault: vaults[0],
              notes: engine.notes,
              wsRoot,
              fname: "root",
            })!
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
        onInit: async ({ vaults, wsRoot, engine }) => {
          // Try to make sure we're opening this for the first time
          await VSCodeUtils.closeAllEditors();
          getExtension().workspaceWatcher = new WorkspaceWatcher();
          getExtension().workspaceWatcher?.activate(ctx);

          watcher.activate(ctx);
          // Open a note
          const first = NoteUtils.getNoteByFnameV5({
            vault: vaults[0],
            notes: engine.notes,
            wsRoot,
            fname: "root",
          })!;
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
          const second = NoteUtils.getNoteByFnameV5({
            vault: vaults[1],
            notes: engine.notes,
            wsRoot,
            fname: "root",
          })!;
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
