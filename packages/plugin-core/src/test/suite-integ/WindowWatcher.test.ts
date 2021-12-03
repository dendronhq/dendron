import { NoteUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WindowWatcher } from "../../windowWatcher";
import { getExtension } from "../../workspace";
import { WorkspaceWatcher } from "../../WorkspaceWatcher";
import { WSUtils } from "../../WSUtils";
import { expect, runSingleVaultTest } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("WindowWatcher", function () {
  let ctx: vscode.ExtensionContext;
  let watcher: WindowWatcher;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("onDidChange", () => {
    test("basic", (done) => {
      runSingleVaultTest({
        ctx,
        postSetupHook: async ({ vaults, wsRoot }) => {
          const vault = vaults[0];
          await NoteTestUtilsV4.createNote({
            fname: "bar",
            body: "bar body",
            vault,
            wsRoot,
          });
        },
        onInit: async ({ vault, wsRoot }) => {
          const vaultPath = vault.fsPath;
          watcher = new WindowWatcher();
          const notePath = path.join(wsRoot, vaultPath, "bar.md");
          const uri = vscode.Uri.file(notePath);
          const editor = await VSCodeUtils.openFileInEditor(uri);
          await watcher.triggerUpdateDecorations(editor!);
          // TODO: check for decorations
          done();
        },
      });
    });
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
          watcher = new WindowWatcher();
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
          watcher = new WindowWatcher();
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
