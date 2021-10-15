import {
  IntermediateDendronConfig,
  DVaultSync,
  DVault,
} from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { Git, SyncActionStatus } from "@dendronhq/engine-server";
import { GitTestUtils } from "@dendronhq/engine-test-utils";
import _, { PartialShallow } from "lodash";
import { describe } from "mocha";
import * as vscode from "vscode";
import { SyncCommand } from "../../commands/Sync";
import { getExtension } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("workspace sync command", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {});

  describe("no repo", () => {
    test("do nothing", (done) => {
      runLegacyMultiWorkspaceTest({
        onInit: async ({}) => {
          const out = await new SyncCommand().execute();
          expect(out).toBeTruthy();
          const { committed, pulled, pushed } = out;
          // Nothing should have happened since there is no repository
          expect(SyncCommand.countDone(committed)).toEqual(0);
          expect(SyncCommand.countDone(pulled)).toEqual(0);
          expect(SyncCommand.countDone(pushed)).toEqual(0);
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
          await changeConfig(wsRoot, { workspaceVaultSync: DVaultSync.SYNC });
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
          expect(out).toBeTruthy();
          const { committed, pulled, pushed } = out;
          // The note created above should get committed
          expect(SyncCommand.countDone(committed)).toEqual(1);
          // Nothing to pull or push since we don't have a remote set up
          expect(SyncCommand.countDone(pulled)).toEqual(0);
          expect(SyncCommand.countDone(pushed)).toEqual(0);
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
          const { committed, pulled, pushed } = out;
          // Should not attempt to commit since this is technically a workspace vault, and the default is noCommit
          // (the repo is at the root of the workspace, vault doesn't have it's own repo)
          expect(SyncCommand.countDone(committed)).toEqual(0);
          // Should attempt to pull since the remote is set up
          expect(SyncCommand.countDone(pulled)).toEqual(1);
          // Should not push since there are no comitted changes
          // (no commit since createRepo..., unlike other tests where changeConfig creates a commit)
          expect(SyncCommand.countDone(pushed)).toEqual(0);
          done();
        },
        ctx,
      });
    });
  });

  describe("with workspace vault config", async () => {
    test("no commit", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          await changeConfig(wsRoot, {
            workspaceVaultSync: DVaultSync.NO_COMMIT,
          });
          // Create a new note so there are some changes
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
          const { committed, pulled, pushed } = out;
          // Nothing should get committed since "noCommit" is used
          expect(SyncCommand.countDone(committed)).toEqual(0);
          // Should pull and push since configuration allows it
          expect(SyncCommand.countDone(pulled)).toEqual(1);
          expect(SyncCommand.countDone(pushed)).toEqual(1);
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
          await changeConfig(wsRoot, {
            workspaceVaultSync: DVaultSync.NO_PUSH,
          });
          // Create a new note so there are some changes
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
          const { committed, pulled, pushed } = out;
          // The note added should get committed
          expect(SyncCommand.countDone(committed)).toEqual(1);
          // Should try to pull since allowed by configuration
          expect(SyncCommand.countDone(pulled)).toEqual(1);
          // Should not push since "noPush" is used
          expect(SyncCommand.countDone(pushed)).toEqual(0);
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
          await changeConfig(wsRoot, { workspaceVaultSync: DVaultSync.SKIP });
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
          expect(SyncCommand.countDone(committed)).toEqual(0);
          expect(SyncCommand.countDone(pulled)).toEqual(0);
          expect(SyncCommand.countDone(pushed)).toEqual(0);
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
          await changeConfig(wsRoot, { workspaceVaultSync: DVaultSync.SYNC });
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
          expect(SyncCommand.countDone(committed)).toEqual(1);
          expect(SyncCommand.countDone(pulled)).toEqual(1);
          expect(SyncCommand.countDone(pushed)).toEqual(1);
          done();
        },
      });
    });
  });

  describe("with per-vault config", async () => {
    test("no commit", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          await changeConfig(wsRoot, {
            vaults: [{ sync: DVaultSync.NO_COMMIT }] as DVault[],
          });
          // Create a new note so there are some changes
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
          const { committed, pulled, pushed } = out;
          // Nothing should get committed since "noCommit" is used
          expect(SyncCommand.countDone(committed)).toEqual(0);
          // Should pull and push since configuration allows it
          expect(SyncCommand.countDone(pulled)).toEqual(1);
          expect(SyncCommand.countDone(pushed)).toEqual(1);
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
          await changeConfig(wsRoot, {
            vaults: [{ sync: DVaultSync.NO_PUSH }] as DVault[],
          });
          // Create a new note so there are some changes
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
          const { committed, pulled, pushed } = out;
          // The note added should get committed
          expect(SyncCommand.countDone(committed)).toEqual(1);
          // Should try to pull since allowed by configuration
          expect(SyncCommand.countDone(pulled)).toEqual(1);
          // Should not push since "noPush" is used
          expect(SyncCommand.countDone(pushed)).toEqual(0);
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
          await changeConfig(wsRoot, {
            vaults: [{ sync: DVaultSync.SKIP }] as DVault[],
          });
          // Create a new note so there are some changes
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
          const { committed, pulled, pushed } = out;
          // Nothing should be done since "skip" is used
          expect(SyncCommand.countDone(committed)).toEqual(0);
          expect(SyncCommand.countDone(pulled)).toEqual(0);
          expect(SyncCommand.countDone(pushed)).toEqual(0);
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
          await changeConfig(wsRoot, {
            vaults: [{ sync: DVaultSync.SYNC }] as DVault[],
          });
          // Create a new note so there are some changes
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
          const { committed, pulled, pushed } = out;
          // Should try doing everything since the config requires so
          expect(SyncCommand.countDone(committed)).toEqual(1);
          expect(SyncCommand.countDone(pulled)).toEqual(1);
          expect(SyncCommand.countDone(pushed)).toEqual(1);
          done();
        },
      });
    });
  });

  describe("edge cases", () => {
    test("has remote, but branch has no upstream", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          await checkoutNewBranch(wsRoot, "test-branch");
          await changeConfig(wsRoot, {
            vaults: [{ sync: DVaultSync.SYNC }] as DVault[],
          });
          // Create a new note so there are some changes
          await NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            body: "Lorem ipsum",
            wsRoot,
            vault: vaults[0],
          });

          const out = await new SyncCommand().execute();
          const { committed, pulled, pushed } = out;
          // Should try to commit since there are changes
          expect(SyncCommand.countDone(committed)).toEqual(1);
          // Won't be able to pull or push because new branch has no upstream.
          // This should be gracefully handled.
          expect(SyncCommand.countDone(pulled)).toEqual(0);
          expect(pulled[0].status === SyncActionStatus.NO_UPSTREAM);
          expect(SyncCommand.countDone(pushed)).toEqual(0);
          expect(pushed[0].status === SyncActionStatus.NO_UPSTREAM);
          done();
        },
      });
    });
  });
});

async function checkoutNewBranch(wsRoot: string, branch: string) {
  const git = new Git({ localUrl: wsRoot });
  await git._execute(`git checkout -b ${branch} --no-track`);
}

/** Override the config option in `dendron.yml`, then add commit that change. */
async function changeConfig(
  wsRoot: string,
  overrideConfig: PartialShallow<IntermediateDendronConfig>
) {
  // Get old config, and override it with the new config
  const serv = getExtension().workspaceService!;
  const config = serv.config;
  await serv.setConfig(_.merge(config, overrideConfig));

  // Commit this change, otherwise it will be a tracked file with changes which breaks git pull
  const git = new Git({ localUrl: wsRoot });
  await git.add("dendron.yml");
  await git.commit({ msg: "update-config" });
}
