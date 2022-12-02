import {
  DVaultSync,
  DVault,
  ConfigUtils,
  NoteUtils,
  VaultUtils,
  ConfigService,
  URI,
} from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { FileTestUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  Git,
  SyncActionStatus,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import { GitTestUtils } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe } from "mocha";
import { SyncCommand } from "../../commands/Sync";
import { expect } from "../testUtilsv2";
import {
  describeSingleWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";
import fs from "fs-extra";
import { ExtensionProvider } from "../../ExtensionProvider";
import path from "path";

suite("workspace sync command", function () {
  const ctx = setupBeforeAfter(this, {});

  describe("no repo", () => {
    test("do nothing", (done) => {
      runLegacyMultiWorkspaceTest({
        onInit: async () => {
          const out = await new SyncCommand().execute();
          expect(out).toBeTruthy();
          const { committed, pulled, pushed } = out;
          // Nothing should have happened since there is no repository
          expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
          expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
          expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
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
          await changeConfig(
            wsRoot,
            "workspace.workspaceVaultSyncMode",
            DVaultSync.SYNC
          );
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
          expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
          // Nothing to pull or push since we don't have a remote set up
          expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
          expect(pulled[0].status).toEqual(SyncActionStatus.NO_REMOTE);
          expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
          expect(pushed[0].status).toEqual(SyncActionStatus.NO_REMOTE);
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
          expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
          expect(committed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
          // Should attempt to pull since the remote is set up
          expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
          // Should not push since there are no comitted changes
          // (no commit since createRepo..., unlike other tests where changeConfig creates a commit)
          expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
          expect(pushed[0].status).toEqual(SyncActionStatus.NO_CHANGES);
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
        modConfigCb: (config) => {
          ConfigUtils.setWorkspaceProp(
            config,
            "workspaceVaultSyncMode",
            DVaultSync.SKIP
          );
          return config;
        },
        onInit: async ({ wsRoot, vaults }) => {
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          await changeConfig(
            wsRoot,
            "workspace.workspaceVaultSyncMode",
            DVaultSync.NO_COMMIT
          );
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
          expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
          expect(committed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
          // Should pull and push since configuration allows it
          expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
          expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(1);
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
          await changeConfig(
            wsRoot,
            "workspace.workspaceVaultSyncMode",
            DVaultSync.NO_PUSH
          );
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
          expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
          // Should try to pull since allowed by configuration
          expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
          // Should not push since "noPush" is used
          expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
          expect(pushed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
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
          await changeConfig(
            wsRoot,
            "workspace.workspaceVaultSyncMode",
            DVaultSync.SKIP
          );
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
          expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
          expect(committed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
          expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
          expect(pulled[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
          expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
          expect(pushed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
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
          await changeConfig(
            wsRoot,
            "workspace.workspaceVaultSyncMode",
            DVaultSync.SYNC
          );
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
          expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
          expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
          expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(1);
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
          await changeConfig(wsRoot, "workspace.vaults", [
            { fsPath: "vault1", sync: DVaultSync.NO_COMMIT },
            { fsPath: "vault2" },
            { fsPath: "vault3", name: "vaultThree" },
          ] as DVault[]);
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
          expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
          expect(committed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
          // Should pull and push since configuration allows it
          expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
          expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(1);
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
          await changeConfig(wsRoot, "workspace.vaults", [
            { fsPath: "vault1", sync: DVaultSync.NO_PUSH },
            { fsPath: "vault2" },
            { fsPath: "vault3", name: "vaultThree" },
          ] as DVault[]);
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
          expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
          // Should try to pull since allowed by configuration
          expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
          // Should not push since "noPush" is used
          expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
          expect(pushed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
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
          await changeConfig(wsRoot, "workspace.vaults", [
            { fsPath: "vault1", sync: DVaultSync.SKIP },
            { fsPath: "vault2" },
            { fsPath: "vault3", name: "vaultThree" },
          ] as DVault[]);
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
          expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
          expect(committed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
          expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
          expect(pulled[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
          expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
          expect(pushed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
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
          await changeConfig(wsRoot, "workspace.vaults", [
            { fsPath: "vault1", sync: DVaultSync.SYNC },
            { fsPath: "vault2" },
            { fsPath: "vault3", name: "vaultThree" },
          ] as DVault[]);
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
          expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
          expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
          expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(1);
          done();
        },
      });
    });
  });

  describe("WHEN repo has remote, but branch has no upstream", () => {
    test("THEN Dendron commits and warns about missing upstream", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const remoteDir = tmpDir().name;
          await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
          await checkoutNewBranch(wsRoot, "test-branch");
          await changeConfig(wsRoot, "workspace.vaults", [
            { fsPath: "vault1", sync: DVaultSync.SYNC },
            { fsPath: "vault2" },
            { fsPath: "vault3", name: "vaultThree" },
          ] as DVault[]);
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
          expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
          // Won't be able to pull or push because new branch has no upstream.
          // This should be gracefully handled.
          expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
          expect(pulled[0].status).toEqual(SyncActionStatus.NO_UPSTREAM);
          expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
          expect(pushed[0].status).toEqual(SyncActionStatus.NO_UPSTREAM);
          done();
        },
      });
    });
  });

  describeSingleWS(
    "WHEN there are no changes",
    {
      ctx,
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
        return config;
      },
    },
    () => {
      test("THEN Dendron skips committing", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        // Add everything and push, so that there's no changes
        const git = new Git({ localUrl: wsRoot });
        await git.addAll();
        await git.commit({ msg: "add all and commit" });
        await git.push();

        const out = await new SyncCommand().execute();
        const { committed, pulled, pushed } = out;
        // Should skip committing since it's set to no commit
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(SyncActionStatus.NO_CHANGES);
        // Should still pull
        expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
        // nothing to push either
        expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
        expect(pushed[0].status).toEqual(SyncActionStatus.NO_CHANGES);
      });
    }
  );

  describeSingleWS(
    "WHEN there are tracked, uncommitted changes",
    {
      ctx,
      modConfigCb: (config) => {
        const vaults = ConfigUtils.getVaults(config);
        vaults[0].sync = DVaultSync.NO_COMMIT;
        ConfigUtils.setVaults(config, vaults);
        return config;
      },
    },
    () => {
      test("THEN Dendron stashes and restores the changes", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        // Add everything and push, so that there's no untracked changes
        const git = new Git({ localUrl: wsRoot });
        await git.addAll();
        await git.commit({ msg: "add all and commit" });
        await git.push();
        // Update root note so there are tracked changes
        const fpath = NoteUtils.getFullPath({
          note: (
            await engine.findNotesMeta({ fname: "root", vault: vaults[0] })
          )[0],
          wsRoot,
        });
        await fs.appendFile(fpath, "Similique non atque");
        // Also create an untracked change
        const untrackedChange = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          fname: "untracked-new-note",
          vault: vaults[0],
          wsRoot,
          body: "Quia dolores rem ad et aut.",
        });

        const out = await new SyncCommand().execute();
        const { committed, pulled, pushed } = out;
        // Should skip committing since it's set to no commit
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
        // Should still stash and pull
        expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
        // the changes, tracked and untracked, should be restored after the pull
        await FileTestUtils.assertInFile({
          fpath,
          match: ["Similique non atque"],
        });
        await FileTestUtils.assertInFile({
          fpath: NoteUtils.getFullPath({ note: untrackedChange, wsRoot }),
          match: ["Quia dolores rem ad et aut."],
        });
        GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" });
        // nothing to push
        expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
        expect(pushed[0].status).toEqual(SyncActionStatus.NO_CHANGES);
      });
    }
  );

  describeSingleWS(
    "WHEN there are tracked, uncommitted changes",
    {
      ctx,
      modConfigCb: (config) => {
        const vaults = ConfigUtils.getVaults(config);
        vaults[0].sync = DVaultSync.NO_COMMIT;
        ConfigUtils.setVaults(config, vaults);
        return config;
      },
    },
    () => {
      test("THEN Dendron stashes and restores the changes", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        // Add everything and push, so that there's no untracked changes
        const git = new Git({ localUrl: wsRoot });
        await git.addAll();
        await git.commit({ msg: "add all and commit" });
        await git.push();
        // Update root note so there are tracked changes
        const fpath = NoteUtils.getFullPath({
          note: (
            await engine.findNotesMeta({ fname: "root", vault: vaults[0] })
          )[0],
          wsRoot,
        });
        await fs.appendFile(fpath, "Similique non atque");
        // Also create an untracked change
        const untrackedChange = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          fname: "untracked-new-note",
          vault: vaults[0],
          wsRoot,
          body: "Quia dolores rem ad et aut.",
        });

        const out = await new SyncCommand().execute();
        const { committed, pulled, pushed } = out;
        // Should skip committing since it's set to no commit
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
        // Should still stash and pull
        expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
        // the changes, tracked and untracked, should be restored after the pull
        await FileTestUtils.assertInFile({
          fpath,
          match: ["Similique non atque"],
        });
        await FileTestUtils.assertInFile({
          fpath: NoteUtils.getFullPath({ note: untrackedChange, wsRoot }),
          match: ["Quia dolores rem ad et aut."],
        });
        // There should be tracked, uncommitted changes
        expect(
          await GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })
        ).toBeTruthy();
        // nothing to push
        expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
        expect(pushed[0].status).toEqual(SyncActionStatus.NO_CHANGES);
      });
    }
  );

  describeSingleWS(
    "WHEN git pull adds changes that conflict with local changes",
    {
      ctx,
      modConfigCb: (config) => {
        const vaults = ConfigUtils.getVaults(config);
        vaults[0].sync = DVaultSync.NO_COMMIT;
        ConfigUtils.setVaults(config, vaults);
        return config;
      },
    },
    () => {
      test("THEN Dendron still restores local changes", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        // Add everything and push, so that there's no untracked changes
        const git = new Git({ localUrl: wsRoot });
        await git.addAll();
        await git.commit({ msg: "add all and commit" });
        await git.push();
        const note = (
          await engine.findNotesMeta({ fname: "root", vault: vaults[0] })
        )[0];
        // Clone to a second location, then push a change through that
        const secondaryDir = tmpDir().name;
        const secondaryGit = new Git({
          localUrl: secondaryDir,
          remoteUrl: remoteDir,
        });
        await secondaryGit.clone(".");
        const secondaryFpath = NoteUtils.getFullPath({
          note,
          wsRoot: secondaryDir,
        });
        await fs.appendFile(secondaryFpath, "Aut ut nisi dolores quae et");
        await secondaryGit.addAll();
        await secondaryGit.commit({ msg: "secondary" });
        await secondaryGit.push();

        // Update root note so there are tracked changes
        const fpath = NoteUtils.getFullPath({
          note,
          wsRoot,
        });
        await fs.appendFile(fpath, "Similique non atque");
        // Also create an untracked change
        const untrackedChange = await NoteTestUtilsV4.createNoteWithEngine({
          engine,
          fname: "untracked-new-note",
          vault: vaults[0],
          wsRoot,
          body: "Quia dolores rem ad et aut.",
        });

        const out = await new SyncCommand().execute();
        const { committed, pulled, pushed } = out;
        // Should skip committing since it's set to no commit
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        // Should still stash and pull, but notice the merge conflict after restoring
        expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
        expect(pulled[0].status).toEqual(
          SyncActionStatus.MERGE_CONFLICT_AFTER_RESTORE
        );
        // the changes, tracked and untracked, should be restored after the pull
        await FileTestUtils.assertInFile({
          fpath,
          match: [
            // The uncommitted changes in this repo, restored
            "Similique non atque",
            // The pulled changes from the secondary dir
            "Aut ut nisi dolores quae et",
            // There's a merge conflict because of the pulled changes
            "<<<<<",
            ">>>>>",
          ],
        });
        await FileTestUtils.assertInFile({
          fpath: NoteUtils.getFullPath({ note: untrackedChange, wsRoot }),
          match: ["Quia dolores rem ad et aut."],
        });
        // There should be tracked, uncommitted changes
        expect(
          await GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })
        ).toBeTruthy();
        // nothing to push
        expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
        expect(pushed[0].status).toEqual(SyncActionStatus.MERGE_CONFLICT);
      });
    }
  );

  describeSingleWS(
    "WHEN git pull adds changes that don't conflict with local changes",
    {
      ctx,
      modConfigCb: (config) => {
        const vaults = ConfigUtils.getVaults(config);
        vaults[0].sync = DVaultSync.NO_COMMIT;
        ConfigUtils.setVaults(config, vaults);
        return config;
      },
    },
    () => {
      test("THEN Dendron still restores local changes", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const rootNote = (
          await engine.findNotesMeta({ fname: "root", vault: vaults[0] })
        )[0];
        const otherNote = await NoteTestUtilsV4.createNoteWithEngine({
          fname: "non-conflicting",
          vault: vaults[0],
          wsRoot,
          engine,
        });
        // Add everything and push, so that there's no untracked changes
        const git = new Git({ localUrl: wsRoot });
        await git.addAll();
        await git.commit({ msg: "add all and commit" });
        await git.push();

        // Clone to a second location, then push a change through that
        const secondaryDir = tmpDir().name;
        const secondaryGit = new Git({
          localUrl: secondaryDir,
          remoteUrl: remoteDir,
        });
        await secondaryGit.clone(".");
        const secondaryFpath = NoteUtils.getFullPath({
          note: otherNote,
          wsRoot: secondaryDir,
        });
        await fs.appendFile(secondaryFpath, "Aut ut nisi dolores quae et");
        await secondaryGit.addAll();
        await secondaryGit.commit({ msg: "secondary" });
        await secondaryGit.push();

        // Update root note so there are tracked changes
        const fpath = NoteUtils.getFullPath({
          note: rootNote,
          wsRoot,
        });
        await fs.appendFile(fpath, "Similique non atque");
        const otherNoteFpath = NoteUtils.getFullPath({
          note: otherNote,
          wsRoot,
        });

        const out = await new SyncCommand().execute();
        const { committed, pulled, pushed } = out;
        // Should skip committing since it's set to no commit
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
        // Should still stash and pull
        expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
        // the changes, tracked and untracked, should be restored after the pull
        await FileTestUtils.assertInFile({
          fpath,
          match: [
            // The uncommitted changes in this repo, restored
            "Similique non atque",
          ],
          nomatch: [
            // No merge conflict
            "<<<<<",
            ">>>>>",
          ],
        });
        await FileTestUtils.assertInFile({
          fpath: otherNoteFpath,
          // we have the change that we pulled in
          match: ["Aut ut nisi dolores quae et"],
          nomatch: [
            // No merge conflict
            "<<<<<",
            ">>>>>",
          ],
        });
        // There should be tracked, uncommitted changes
        expect(
          await GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })
        ).toBeTruthy();
        // nothing to push
        expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
        expect(pushed[0].status).toEqual(SyncActionStatus.NO_CHANGES);
      });
    }
  );

  describeSingleWS(
    "WHEN git pull causes a rebase",
    {
      ctx,
      modConfigCb: (config) => {
        const vaults = ConfigUtils.getVaults(config);
        vaults[0].sync = DVaultSync.NO_COMMIT;
        ConfigUtils.setVaults(config, vaults);
        return config;
      },
    },
    () => {
      test("THEN rebase works, and Dendron still restores local changes", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const rootNote = (
          await engine.findNotesMeta({ fname: "root", vault: vaults[0] })
        )[0];
        const otherNote = await NoteTestUtilsV4.createNoteWithEngine({
          fname: "non-conflicting",
          vault: vaults[0],
          wsRoot,
          engine,
        });
        // Add everything and push, so that there's no untracked changes
        const git = new Git({ localUrl: wsRoot });
        await git.addAll();
        await git.commit({ msg: "first commit" });
        await git.push();
        // Update root note and add a commit that's not in remote, so there'll be something to rebase
        const fpath = NoteUtils.getFullPath({
          note: rootNote,
          wsRoot,
        });
        await fs.appendFile(fpath, "Deserunt culpa in expedita\n");
        const otherNoteFpath = NoteUtils.getFullPath({
          note: otherNote,
          wsRoot,
        });
        await git.addAll();
        await git.commit({ msg: "second commit" });

        // Clone to a second location, then push a change through that
        const secondaryDir = tmpDir().name;
        const secondaryGit = new Git({
          localUrl: secondaryDir,
          remoteUrl: remoteDir,
        });
        await secondaryGit.clone(".");
        const secondaryFpath = NoteUtils.getFullPath({
          note: otherNote,
          wsRoot: secondaryDir,
        });
        await fs.appendFile(secondaryFpath, "Aut ut nisi dolores quae et\n");
        await secondaryGit.addAll();
        await secondaryGit.commit({ msg: "secondary" });
        await secondaryGit.push();

        // Update root note so there are tracked changes
        await fs.appendFile(fpath, "Similique non atque\n");

        const out = await new SyncCommand().execute();
        const { committed, pulled, pushed } = out;
        // Should skip committing since it's set to no commit
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
        // Should still stash and pull
        expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
        // the changes, tracked and untracked, should be restored after the pull
        await FileTestUtils.assertInFile({
          fpath,
          match: [
            // The uncommitted changes in this repo, restored
            "Similique non atque",
            // the rebased change is still there too
            "Deserunt culpa in expedita",
          ],
          nomatch: [
            // No merge conflict
            "<<<<<",
            ">>>>>",
          ],
        });
        await FileTestUtils.assertInFile({
          fpath: otherNoteFpath,
          // we have the change that we pulled in
          match: ["Aut ut nisi dolores quae et"],
          nomatch: [
            // No merge conflict
            "<<<<<",
            ">>>>>",
          ],
        });
        // There should be tracked, uncommitted changes
        expect(
          await GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })
        ).toBeTruthy();
        expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(1);
      });
    }
  );

  describeSingleWS(
    "WHEN git pull causes a rebase but hits a conflict, and there are no local changes",
    {
      ctx,
      modConfigCb: (config) => {
        const vaults = ConfigUtils.getVaults(config);
        vaults[0].sync = DVaultSync.NO_COMMIT;
        ConfigUtils.setVaults(config, vaults);
        return config;
      },
    },
    () => {
      test("THEN pull succeeds but there's a merge conflict", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const rootNote = (
          await engine.findNotesMeta({ fname: "root", vault: vaults[0] })
        )[0];
        // Add everything and push, so that there's no untracked changes
        const git = new Git({ localUrl: wsRoot });
        await git.addAll();
        await git.commit({ msg: "first commit" });
        await git.push();
        // Update root note and add a commit that's not in remote, so there'll be something to rebase
        const fpath = NoteUtils.getFullPath({
          note: rootNote,
          wsRoot,
        });
        await fs.appendFile(fpath, "Deserunt culpa in expedita\n");
        await git.addAll();
        await git.commit({ msg: "second commit" });

        // Clone to a second location, then push a change through that
        const secondaryDir = tmpDir().name;
        const secondaryGit = new Git({
          localUrl: secondaryDir,
          remoteUrl: remoteDir,
        });
        await secondaryGit.clone(".");
        const secondaryFpath = NoteUtils.getFullPath({
          note: rootNote,
          wsRoot: secondaryDir,
        });
        await fs.appendFile(secondaryFpath, "Aut ut nisi dolores quae et\n");
        await secondaryGit.addAll();
        await secondaryGit.commit({ msg: "secondary" });
        await secondaryGit.push();

        const out = await new SyncCommand().execute();
        const { committed, pulled, pushed } = out;
        // Should skip committing since it's set to no commit
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
        // Should still stash and pull
        expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
        expect(pulled[0].status).toEqual(
          SyncActionStatus.MERGE_CONFLICT_AFTER_PULL
        );
        // the changes, tracked and untracked, should be restored after the pull
        await FileTestUtils.assertInFile({
          fpath,
          match: [
            // the stuff before the pull is still there
            "Deserunt culpa in expedita",
            // The pulled stuff is there
            "Aut ut nisi dolores quae et",
            // there's a merge conflict
            "<<<<<",
            ">>>>>",
          ],
        });
        // There should be tracked, uncommitted changes
        expect(
          await GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })
        ).toBeTruthy();
        // can't push because there's a merge conflict that happened during the pull
        expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
        expect(pushed[0].status).toEqual(SyncActionStatus.MERGE_CONFLICT);
      });
    }
  );

  describeSingleWS(
    "WHEN git pull causes a rebase but hits a conflict, and there are local changes",
    {
      ctx,
      modConfigCb: (config) => {
        const vaults = ConfigUtils.getVaults(config);
        vaults[0].sync = DVaultSync.NO_COMMIT;
        ConfigUtils.setVaults(config, vaults);
        return config;
      },
    },
    () => {
      test("THEN pull fails, and Dendron restores local changes", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const rootNote = (
          await engine.findNotesMeta({ fname: "root", vault: vaults[0] })
        )[0];
        // Add everything and push, so that there's no untracked changes
        const git = new Git({ localUrl: wsRoot });
        await git.addAll();
        await git.commit({ msg: "first commit" });
        await git.push();
        // Update root note and add a commit that's not in remote, so there'll be something to rebase
        const fpath = NoteUtils.getFullPath({
          note: rootNote,
          wsRoot,
        });
        await fs.appendFile(fpath, "Deserunt culpa in expedita\n");
        await git.addAll();
        await git.commit({ msg: "second commit" });

        // Clone to a second location, then push a change through that
        const secondaryDir = tmpDir().name;
        const secondaryGit = new Git({
          localUrl: secondaryDir,
          remoteUrl: remoteDir,
        });
        await secondaryGit.clone(".");
        const secondaryFpath = NoteUtils.getFullPath({
          note: rootNote,
          wsRoot: secondaryDir,
        });
        await fs.appendFile(secondaryFpath, "Aut ut nisi dolores quae et\n");
        await secondaryGit.addAll();
        await secondaryGit.commit({ msg: "secondary" });
        await secondaryGit.push();

        // Update root note so there are tracked changes
        await fs.appendFile(fpath, "Similique non atque\n");

        const out = await new SyncCommand().execute();
        const { committed, pulled, pushed } = out;
        // Should skip committing since it's set to no commit
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(SyncActionStatus.SKIP_CONFIG);
        // Should still stash and pull
        expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
        expect(pulled[0].status).toEqual(
          SyncActionStatus.MERGE_CONFLICT_LOSES_CHANGES
        );
        // the changes, tracked and untracked, should be restored after the pull
        await FileTestUtils.assertInFile({
          fpath,
          match: [
            // The uncommitted changes in this repo, restored
            "Similique non atque",
            // the stuff before the pull is still there
            "Deserunt culpa in expedita",
          ],
          nomatch: [
            // no conflict because we rolled it back
            "<<<<<",
            ">>>>>",
            // We failed to pull
            "Aut ut nisi dolores quae et",
          ],
        });
        // There should be tracked, uncommitted changes
        expect(
          await GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })
        ).toBeTruthy();
        // can't push because we couldn't pull the changes
        expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
        expect(pushed[0].status).toEqual(SyncActionStatus.UNPULLED_CHANGES);
      });
    }
  );

  describeSingleWS(
    "WHEN there is a merge conflict",
    {
      ctx,
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
        return config;
      },
    },
    () => {
      test("THEN Dendron skips doing stuff", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const rootNote = (
          await engine.findNotesMeta({ fname: "root", vault: vaults[0] })
        )[0];
        // Add everything and push, so that there's no untracked changes
        const git = new Git({ localUrl: wsRoot, remoteUrl: remoteDir });
        await git.addAll();
        await git.commit({ msg: "first commit" });
        await git.push();
        // Update root note and add a commit that's not in remote, so there'll be something to rebase
        const fpath = NoteUtils.getFullPath({
          note: rootNote,
          wsRoot,
        });
        await fs.appendFile(fpath, "Deserunt culpa in expedita\n");
        await git.addAll();
        await git.commit({ msg: "second commit" });

        // Clone to a second location, then push a change through that
        const secondaryDir = tmpDir().name;
        const secondaryGit = new Git({
          localUrl: secondaryDir,
          remoteUrl: remoteDir,
        });
        await secondaryGit.clone(".");
        const secondaryFpath = NoteUtils.getFullPath({
          note: rootNote,
          wsRoot: secondaryDir,
        });
        await fs.appendFile(secondaryFpath, "Aut ut nisi dolores quae et\n");
        await secondaryGit.addAll();
        await secondaryGit.commit({ msg: "secondary" });
        await secondaryGit.push();

        // Cause an ongoing rebase
        try {
          await git.pull();
        } catch {
          // deliberately ignored
        }

        const out = await new SyncCommand().execute();
        const { committed, pulled, pushed } = out;
        // Should skip everything since there's an ongoing rebase the user needs to resolve
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(SyncActionStatus.MERGE_CONFLICT);
        expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
        expect(pulled[0].status).toEqual(SyncActionStatus.MERGE_CONFLICT);
        expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
        expect(pushed[0].status).toEqual(SyncActionStatus.MERGE_CONFLICT);
      });
    }
  );

  describeSingleWS(
    "WHEN there is a rebase in progress, but the merge conflict has been resolved already",
    {
      ctx,
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
        return config;
      },
    },
    () => {
      test("THEN Dendron skips doing stuff", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const rootNote = (
          await engine.findNotesMeta({ fname: "root", vault: vaults[0] })
        )[0];
        // Add everything and push, so that there's no untracked changes
        const git = new Git({ localUrl: wsRoot, remoteUrl: remoteDir });
        await git.addAll();
        await git.commit({ msg: "first commit" });
        await git.push();
        // Update root note and add a commit that's not in remote, so there'll be something to rebase
        const fpath = NoteUtils.getFullPath({
          note: rootNote,
          wsRoot,
        });
        await fs.appendFile(fpath, "Deserunt culpa in expedita\n");
        await git.addAll();
        await git.commit({ msg: "second commit" });

        // Clone to a second location, then push a change through that
        const secondaryDir = tmpDir().name;
        const secondaryGit = new Git({
          localUrl: secondaryDir,
          remoteUrl: remoteDir,
        });
        await secondaryGit.clone(".");
        const secondaryFpath = NoteUtils.getFullPath({
          note: rootNote,
          wsRoot: secondaryDir,
        });
        await fs.appendFile(secondaryFpath, "Aut ut nisi dolores quae et\n");
        await secondaryGit.addAll();
        await secondaryGit.commit({ msg: "secondary" });
        await secondaryGit.push();

        // Cause an ongoing rebase
        try {
          await git.pull();
        } catch {
          // deliberately ignored
        }
        // Mark the conflict as resolved
        await git.add(fpath);

        const out = await new SyncCommand().execute();
        const { committed, pulled, pushed } = out;
        // Should skip everything since there's an ongoing rebase the user needs to resolve
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(
          SyncActionStatus.REBASE_IN_PROGRESS
        );
        expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
        expect(pulled[0].status).toEqual(SyncActionStatus.REBASE_IN_PROGRESS);
        expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
        expect(pushed[0].status).toEqual(SyncActionStatus.REBASE_IN_PROGRESS);
      });
    }
  );

  describeSingleWS(
    "WHEN the remote is bad",
    {
      ctx,
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
        return config;
      },
    },
    () => {
      test("THEN Dendron warns that it can't connect to the remote", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        // Delete the remote at this point so we can't use it
        await fs.rm(remoteDir, { force: true, recursive: true });

        const out = await new SyncCommand().execute();
        const { committed, pulled, pushed } = out;
        // There are some changes to commit
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
        // Should fail to push or pull
        expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
        expect(pulled[0].status).toEqual(SyncActionStatus.BAD_REMOTE);
        expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
        expect(pushed[0].status).toEqual(SyncActionStatus.BAD_REMOTE);
      });
    }
  );

  describeSingleWS(
    "WHEN using a self contained vault, it is treated as a regular vault",
    {
      ctx,
      selfContained: true,
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "skip");
        return config;
      },
    },
    () => {
      test("THEN Dendron stashes and restores the changes", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const remoteDir = tmpDir().name;
        const vault = vaults[0];

        await GitTestUtils.createRepoForRemoteVault({
          wsRoot,
          vault,
          remoteDir,
        });

        // Add the vault to a repo
        const git = new Git({
          localUrl: path.join(wsRoot, VaultUtils.getRelPath(vault)),
        });
        await git.addAll();
        await git.commit({ msg: "add all and commit" });
        await git.push();
        // Update root note so there are tracked changes
        const fpath = NoteUtils.getFullPath({
          note: (
            await engine.findNotesMeta({ fname: "root", vault: vaults[0] })
          )[0],
          wsRoot,
        });
        await fs.appendFile(fpath, "Similique non atque");

        const out = await new SyncCommand().execute();
        const { committed, pulled, pushed } = out;
        // Should use the vault default and sync everthing, and ignore the workspace default config
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
        expect(committed[0].status).toEqual(SyncActionStatus.DONE);
        // Should pull
        expect(WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
        expect(pulled[0].status).toEqual(SyncActionStatus.DONE);
        // Should push
        expect(WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(1);
        expect(pushed[0].status).toEqual(SyncActionStatus.DONE);
      });
    }
  );
});

async function checkoutNewBranch(wsRoot: string, branch: string) {
  const git = new Git({ localUrl: wsRoot });
  await git._execute(`git checkout -b ${branch} --no-track`);
}

/** Override the config option in `dendron.yml`, then add commit that change. */
async function changeConfig(wsRoot: string, overridePath: string, value: any) {
  // Get old config, and override it with the new config
  const config = (
    await ConfigService.instance().readConfig(URI.file(wsRoot))
  )._unsafeUnwrap();
  const override = _.set(config, overridePath, value);
  await ConfigService.instance().writeConfig(URI.file(wsRoot), override);

  // Commit this change, otherwise it will be a tracked file with changes which breaks git pull
  const git = new Git({ localUrl: wsRoot });
  await git.add("dendron.yml");
  await git.commit({ msg: "update-config" });
}
