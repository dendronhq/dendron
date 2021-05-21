import { SyncCommand } from "../../commands/Sync";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import * as vscode from "vscode";
import _ from "lodash";
import { GitTestUtils } from "@dendronhq/engine-test-utils";
import { tmpDir } from "@dendronhq/common-server";
import { describe } from "mocha";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";

suite("workspace sync command", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {});

  describe("no remote", () => {
    test("commit", (done) => {
      runLegacyMultiWorkspaceTest({
        onInit: async ({ wsRoot, vaults }) => {
          await GitTestUtils.createRepoForWorkspace(wsRoot);
          NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().run();
          expect(out).toBeTruthy();
          const { committed, pulled, pushed } = out as any;
          // The note created above should get committed
          expect(committed.length).toEqual(1);
          // Nothing to pull or push since we don't have a remote set up
          expect(pulled.length).toEqual(0);
          expect(pushed.length).toEqual(0);
          done();
        },
        ctx,
      });
    });
  });

  describe("with remote", () => {
    test("commit and push", (done) => {
      runLegacyMultiWorkspaceTest({
        onInit: async ({ wsRoot, vaults }) => {
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().run();
          expect(out).toBeTruthy();
          const { committed, pulled, pushed } = out as any;
          // The files that default wsRoot created should get committed
          expect(committed.length).toEqual(1);
          // Should attemp to pull since the remote is set up
          expect(pulled.length).toEqual(1);
          // Should not attempt to push since this is technically a workspace vault (the repo is at the root of the workspace, vault doesn't have it's own repo)
          expect(pushed.length).toEqual(0);
          done();
        },
        ctx,
      });
    });
  });
});
