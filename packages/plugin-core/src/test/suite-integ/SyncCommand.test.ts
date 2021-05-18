import { SyncCommand } from "../../commands/Sync";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import * as vscode from "vscode";
import _ from "lodash";
import { GitTestUtils } from "@dendronhq/engine-test-utils";
import { tmpDir } from "@dendronhq/common-server";
import { describe } from "mocha";

suite("workspace sync command", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {});

  describe("no remote", async () => {
    test("commit", async () =>
      runLegacyMultiWorkspaceTest({
        onInit: async ({ wsRoot }) => {
          await GitTestUtils.createRepoForWorkspace(wsRoot);

          const out = await new SyncCommand().run();
          expect(out).toBeTruthy();
          const { committed, pulled, pushed } = out as any;
          // The files that default wsRoot created should get committed
          expect(committed.length).toEqual(1);
          // Nothing to pull or push since we don't have a remote set up
          expect(pulled.length).toEqual(0);
          expect(pushed.length).toEqual(0);
        },
        ctx,
      }));
  });

  describe("with remote", async () => {
    test("commit and push", async () =>
      runLegacyMultiWorkspaceTest({
        onInit: async ({ wsRoot }) => {
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);

          const out = await new SyncCommand().run();
          expect(out).toBeTruthy();
          const { committed, pulled, pushed } = out as any;
          // The files that default wsRoot created should get committed
          expect(committed.length).toEqual(1);
          // Nothing to pull, since the remote is empty
          expect(pulled.length).toEqual(0);
          // The commit should be pushed to the remote
          expect(pushed.length).toEqual(1);
        },
        ctx,
      }));
  });
});
