import {
  DVaultSync,
  DVault,
  ConfigUtils,
  NoteUtils,
} from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { FileTestUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { Git, SyncActionStatus } from "@dendronhq/engine-server";
import { GitTestUtils } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe } from "mocha";
import * as vscode from "vscode";
import { SyncCommand } from "../../commands/Sync";
import { getExtension } from "../../workspace";
import { expect } from "../testUtilsv2";
import {
  describeSingleWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";
import fs from "fs-extra";
import { ExtensionProvider } from "../../ExtensionProvider";

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
          expect(SyncCommand.countDone(committed)).toEqual(1);
          expect(SyncCommand.countDone(pulled)).toEqual(1);
          expect(SyncCommand.countDone(pushed)).toEqual(1);
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

  describeSingleWS(
    "WHEN there are tracked, uncommitted changes",
    {
      ctx,
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(
          config,
          "workspaceVaultSyncMode",
          "noCommit"
        );
        return config;
      },
    },
    () => {
      test("THEN Dendron stashes and restores the changes", async () => {
        const { vaults, wsRoot, engine } = ExtensionProvider.getDWorkspace();
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        // Add everything and push, so that there's no untracked changes
        const git = new Git({ localUrl: wsRoot });
        await git.addAll();
        await git.commit({ msg: "add all and commit" });
        await git.push();
        // Update root note so there are tracked changes
        const fpath = NoteUtils.getFullPath({
          note: NoteUtils.getNoteByFnameFromEngine({
            fname: "root",
            vault: vaults[0],
            engine,
          })!,
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
        expect(SyncCommand.countDone(committed)).toEqual(0);
        // Should still stash and pull
        expect(SyncCommand.countDone(pulled)).toEqual(1);
        expect(pulled[0].status === SyncActionStatus.DONE);
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
        expect(SyncCommand.countDone(pushed)).toEqual(0);
        expect(pushed[0].status === SyncActionStatus.NO_CHANGES);
      });
    }
  );

  describeSingleWS(
    "WHEN there are tracked, uncommitted changes",
    {
      ctx,
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(
          config,
          "workspaceVaultSyncMode",
          "noCommit"
        );
        return config;
      },
    },
    () => {
      test("THEN Dendron stashes and restores the changes", async () => {
        const { vaults, wsRoot, engine } = ExtensionProvider.getDWorkspace();
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        // Add everything and push, so that there's no untracked changes
        const git = new Git({ localUrl: wsRoot });
        await git.addAll();
        await git.commit({ msg: "add all and commit" });
        await git.push();
        // Update root note so there are tracked changes
        const fpath = NoteUtils.getFullPath({
          note: NoteUtils.getNoteByFnameFromEngine({
            fname: "root",
            vault: vaults[0],
            engine,
          })!,
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
        expect(SyncCommand.countDone(committed)).toEqual(0);
        // Should still stash and pull
        expect(SyncCommand.countDone(pulled)).toEqual(1);
        expect(pulled[0].status === SyncActionStatus.DONE);
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
        expect(SyncCommand.countDone(pushed)).toEqual(0);
        expect(pushed[0].status === SyncActionStatus.NO_CHANGES);
      });
    }
  );

  describeSingleWS(
    "WHEN git pull adds changes that conflict with local changes",
    {
      ctx,
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(
          config,
          "workspaceVaultSyncMode",
          "noCommit"
        );
        return config;
      },
    },
    () => {
      test("THEN Dendron still restores local changes", async () => {
        const { vaults, wsRoot, engine } = ExtensionProvider.getDWorkspace();
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        // Add everything and push, so that there's no untracked changes
        const git = new Git({ localUrl: wsRoot });
        await git.addAll();
        await git.commit({ msg: "add all and commit" });
        await git.push();
        const note = NoteUtils.getNoteByFnameFromEngine({
          fname: "root",
          vault: vaults[0],
          engine,
        })!;
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
        expect(SyncCommand.countDone(committed)).toEqual(0);
        // Should still stash and pull
        expect(SyncCommand.countDone(pulled)).toEqual(1);
        expect(pulled[0].status === SyncActionStatus.DONE);
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
        expect(SyncCommand.countDone(pushed)).toEqual(0);
        expect(pushed[0].status === SyncActionStatus.NO_CHANGES);
      });
    }
  );

  describeSingleWS(
    "WHEN git pull adds changes that don't conflict with local changes",
    {
      ctx,
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(
          config,
          "workspaceVaultSyncMode",
          "noCommit"
        );
        return config;
      },
    },
    () => {
      test("THEN Dendron still restores local changes", async () => {
        const { vaults, wsRoot, engine } = ExtensionProvider.getDWorkspace();
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const rootNote = NoteUtils.getNoteByFnameFromEngine({
          fname: "root",
          vault: vaults[0],
          engine,
        })!;
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
        expect(SyncCommand.countDone(committed)).toEqual(0);
        // Should still stash and pull
        expect(SyncCommand.countDone(pulled)).toEqual(1);
        expect(pulled[0].status === SyncActionStatus.DONE);
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
        expect(SyncCommand.countDone(pushed)).toEqual(0);
        expect(pushed[0].status === SyncActionStatus.NO_CHANGES);
      });
    }
  );

  describeSingleWS(
    "WHEN git pull causes a rebase",
    {
      ctx,
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(
          config,
          "workspaceVaultSyncMode",
          "noCommit"
        );
        return config;
      },
    },
    () => {
      test("THEN rebase works, and Dendron still restores local changes", async () => {
        const { vaults, wsRoot, engine } = ExtensionProvider.getDWorkspace();
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const rootNote = NoteUtils.getNoteByFnameFromEngine({
          fname: "root",
          vault: vaults[0],
          engine,
        })!;
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
        expect(SyncCommand.countDone(committed)).toEqual(0);
        // Should still stash and pull
        expect(SyncCommand.countDone(pulled)).toEqual(1);
        expect(pulled[0].status === SyncActionStatus.DONE);
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
        expect(SyncCommand.countDone(pushed)).toEqual(1);
      });
    }
  );

  describeSingleWS(
    "WHEN git pull causes a rebase but hits a conflict",
    {
      ctx,
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(
          config,
          "workspaceVaultSyncMode",
          "noCommit"
        );
        return config;
      },
    },
    () => {
      test("THEN rebase works, and Dendron restores local changes with the conflict", async () => {
        const { vaults, wsRoot, engine } = ExtensionProvider.getDWorkspace();
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const rootNote = NoteUtils.getNoteByFnameFromEngine({
          fname: "root",
          vault: vaults[0],
          engine,
        })!;
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
        expect(SyncCommand.countDone(committed)).toEqual(0);
        // Should still stash and pull
        expect(SyncCommand.countDone(pulled)).toEqual(1);
        expect(pulled[0].status === SyncActionStatus.DONE);
        // the changes, tracked and untracked, should be restored after the pull
        await FileTestUtils.assertInFile({
          fpath,
          match: [
            // The uncommitted changes in this repo, restored
            "Similique non atque",
            // the rebased change is still there too
            "Deserunt culpa in expedita",
            // there will be a conflict
            "<<<<<",
            ">>>>>",
          ],
        });
        // There should be tracked, uncommitted changes
        expect(
          await GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })
        ).toBeTruthy();
        // nothing to push
        expect(SyncCommand.countDone(pushed)).toEqual(0);
        expect(pushed[0].status === SyncActionStatus.NO_CHANGES);
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
  const serv = getExtension().workspaceService!;
  const config = serv.config;
  const override = _.set(config, overridePath, value);
  await serv.setConfig(override);

  // Commit this change, otherwise it will be a tracked file with changes which breaks git pull
  const git = new Git({ localUrl: wsRoot });
  await git.add("dendron.yml");
  await git.commit({ msg: "update-config" });
}
