import { ConfigUtils, NoteUtils } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import {
  Git,
  SyncActionStatus,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import { GitTestUtils } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { expect } from "../testUtilsv2";
import { describeSingleWS } from "../testUtilsV3";
import fs from "fs-extra";
import { ExtensionProvider } from "../../ExtensionProvider";
import { AddAndCommit } from "../../commands/AddAndCommit";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";

const TIMEOUT = 60 * 1000 * 5;

suite("GIVEN Workspace Add And Commit command is run", function () {
  this.timeout(TIMEOUT);
  describeSingleWS(
    "WHEN there are no changes",
    {
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
        const out = await new AddAndCommit().execute();
        const { committed, finalMessage } = out;
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(SyncActionStatus.NO_CHANGES);
        expect(finalMessage).toEqual(
          "Finished Commit. Skipped vault because it has no new changes. Committed 0 repo"
        );
      });
    }
  );

  describeSingleWS(
    "WHEN there is a merge conflict",
    {
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
        return config;
      },
    },
    () => {
      test("THEN Dendron skips committing files", async () => {
        const { vaults, wsRoot, engine } = ExtensionProvider.getDWorkspace();
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const rootNote = NoteUtils.getNoteByFnameFromEngine({
          fname: "root",
          vault: vaults[0],
          engine,
        })!;
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

        const out = await new AddAndCommit().execute();
        const { committed, finalMessage } = out;
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(SyncActionStatus.MERGE_CONFLICT);
        expect(finalMessage).toEqual(
          "Finished Commit. Skipped vault because they have merge conflicts that must be resolved manually. Committed 0 repo"
        );
      });
    }
  );

  describeSingleWS(
    "WHEN there is a rebase in progress",
    {
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
        return config;
      },
    },
    () => {
      test("THEN Dendron skips committing files", async () => {
        const { vaults, wsRoot, engine } = ExtensionProvider.getDWorkspace();
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const rootNote = NoteUtils.getNoteByFnameFromEngine({
          fname: "root",
          vault: vaults[0],
          engine,
        })!;
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

        const out = await new AddAndCommit().execute();
        const { committed, finalMessage } = out;
        // Should skip everything since there's an ongoing rebase the user needs to resolve
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(
          SyncActionStatus.REBASE_IN_PROGRESS
        );
        expect(finalMessage).toEqual(
          "Finished Commit. Skipped vault because there's a rebase in progress that must be resolved. Committed 0 repo"
        );
      });
    }
  );

  describeSingleWS(
    "WHEN there are unstaged changes",
    {
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
        return config;
      },
    },
    () => {
      test("THEN Dendron commit files successfully", async () => {
        const { vaults, wsRoot } = ExtensionProvider.getDWorkspace();
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        // Create a new note so there are some changes
        await NoteTestUtilsV4.createNote({
          fname: "my-new-note",
          body: "Lorem ipsum",
          wsRoot,
          vault: vaults[0],
        });

        const out = await new AddAndCommit().execute();
        const { committed, finalMessage } = out;
        // Should try to commit since there are changes
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
        expect(finalMessage).toEqual("Finished Commit. Committed 1 repo");
      });
    }
  );
});
