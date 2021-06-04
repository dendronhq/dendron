import { SyncCommand } from "../../commands/Sync";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import * as vscode from "vscode";
import _ from "lodash";
import { GitTestUtils } from "@dendronhq/engine-test-utils";
import { tmpDir } from "@dendronhq/common-server";
import { describe } from "mocha";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { getWS } from "../../workspace";
import { Git } from "@dendronhq/engine-server";
import { DendronConfig } from "@dendronhq/common-all";

suite("workspace sync command", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {});

  describe("no repo", () => {
    test("do nothing", (done) => {
      runLegacyMultiWorkspaceTest({
        onInit: async ({}) => {
          const out = await new SyncCommand().execute();
          expect(out).toBeTruthy();
          const { committed, pulled, pushed } = out as any;
          // Nothin should have happened since there is no repository
          expect(committed.length).toEqual(0);
          expect(pulled.length).toEqual(0);
          expect(pushed.length).toEqual(0);
          done();
        },
        ctx,
      });
    });
  });

  describe("no remote", () => {
    test("commit", (done) => {
      runLegacyMultiWorkspaceTest({
        onInit: async ({ wsRoot, vaults }) => {
          await GitTestUtils.createRepoForWorkspace(wsRoot);
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
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
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
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

  describe("with remote and workspace vaults", async () => {
    test("no commit", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          await changeConfig(wsRoot, { workspaceVaultSync: "noCommit" });
          // Create a new note so there are some changes
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
          const { committed, pulled, pushed } = out as any;
          // Nothing should get committed since "noCommit" is used
          expect(committed.length).toEqual(0);
          // Should pull and push since configuration allows it
          expect(pulled.length).toEqual(1);
          expect(pushed.length).toEqual(1);
          done();
        },
      });
    });

    test("no push", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          await changeConfig(wsRoot, { workspaceVaultSync: "noPush" });
          // Create a new note so there are some changes
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
          const { committed, pulled, pushed } = out as any;
          // The note added should get committed
          expect(committed.length).toEqual(1);
          // Should try to pull since allowed by configuration
          expect(pulled.length).toEqual(1);
          // Should not push since "noPush" is used
          expect(pushed.length).toEqual(0);
          done();
        },
      });
    });

    test("skip", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          await changeConfig(wsRoot, { workspaceVaultSync: "skip" });
          // Create a new note so there are some changes
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
          const { committed, pulled, pushed } = out as any;
          // Nothing should be done since "skip" is used
          expect(committed.length).toEqual(0);
          expect(pulled.length).toEqual(0);
          expect(pushed.length).toEqual(0);
          done();
        },
      });
    });

    test("sync", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          await changeConfig(wsRoot, { workspaceVaultSync: "sync" });
          // Create a new note so there are some changes
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
          const { committed, pulled, pushed } = out as any;
          // Should try doing everything since the config requires so
          expect(committed.length).toEqual(1);
          expect(pulled.length).toEqual(1);
          expect(pushed.length).toEqual(1);
          done();
        },
      });
    });
  });
});

async function changeConfig(
  wsRoot: string,
  overrideConfig: Partial<DendronConfig>
) {
  // Get old config, and override it with the new config
  const serv = getWS().workspaceService!;
  const config = serv.config;
  await serv.setConfig(_.merge(config, overrideConfig));

  // Commit this change, otherwise it will be a tracked file with changes which breaks git pull
  const git = new Git({ localUrl: wsRoot });
  await git.add("dendron.yml");
  await git.commit({ msg: "update config" });
}
