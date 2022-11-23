import { ConfigUtils } from "@dendronhq/common-all";
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
import { ExtensionProvider } from "../../ExtensionProvider";
import { AddAndCommit } from "../../commands/AddAndCommit";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";

suite("GIVEN Workspace Add And Commit command is run", function () {
  describeSingleWS(
    "WHEN there are no changes",
    {
      modConfigCb: (config) => {
        ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
        return config;
      },
      timeout: 1e4,
    },
    () => {
      test("THEN skip committing AND show no new changes message", async () => {
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
        expect(
          await AssertUtils.assertInString({
            body: finalMessage,
            match: [
              "Finished Commit",
              "Skipped",
              "because it has no new changes",
              "Committed 0 repo",
            ],
          })
        ).toBeTruthy();
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
      timeout: 1e4,
    },
    () => {
      test("THEN skip committing files AND show merge conflict message", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        await GitTestUtils.createRemoteRepoWithRebaseConflict(
          wsRoot,
          vaults,
          engine
        );
        const out = await new AddAndCommit().execute();
        const { committed, finalMessage } = out;
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(SyncActionStatus.MERGE_CONFLICT);
        expect(
          await AssertUtils.assertInString({
            body: finalMessage,
            match: [
              "Finished Commit",
              "Skipped",
              "because they have merge conflicts that must be resolved manually. Committed 0 repo",
            ],
          })
        ).toBeTruthy();
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
      timeout: 1e4,
    },
    () => {
      test("THEN skip committing files AND show rebase conflict message", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const { git, fpath } =
          await GitTestUtils.createRemoteRepoWithRebaseConflict(
            wsRoot,
            vaults,
            engine
          );
        // Mark the conflict as resolved
        await git.add(fpath);

        const out = await new AddAndCommit().execute();
        const { committed, finalMessage } = out;
        // Should skip everything since there's an ongoing rebase the user needs to resolve
        expect(WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
        expect(committed[0].status).toEqual(
          SyncActionStatus.REBASE_IN_PROGRESS
        );
        expect(
          await AssertUtils.assertInString({
            body: finalMessage,
            match: [
              "Finished Commit",
              "Skipped",
              "because there's a rebase in progress that must be resolved. Committed 0 repo",
            ],
          })
        ).toBeTruthy();
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
      timeout: 1e4,
    },
    () => {
      test("THEN Dendron commit files successfully", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
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
