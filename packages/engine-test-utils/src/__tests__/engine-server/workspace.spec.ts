import { NoteProps } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { DConfig, WorkspaceService } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import { testWithEngine } from "../../engine";
import { GitTestUtils } from "../../utils";

describe("WorkspaceService", () => {
  testWithEngine(
    "init remoteVaults present, init",
    async ({ wsRoot, engine }) => {
      const root = tmpDir().name;
      await GitTestUtils.createRepoWithReadme(root);

      engine.config.vaults.push({
        fsPath: "remoteVault",
        remote: {
          type: "git",
          url: root,
        },
      });
      DConfig.writeConfig({ wsRoot, config: engine.config });

      const ws = new WorkspaceService({ wsRoot });
      const didClone = await ws.initialize({
        onSyncVaultsProgress: () => {},
        onSyncVaultsEnd: () => {},
      });
      expect(didClone).toEqual(true);
      expect(
        fs.existsSync(path.join(wsRoot, "remoteVault", "README.md"))
      ).toBeTruthy();
    }
  );

  testWithEngine(
    "init remoteVaults present, no init",
    async ({ wsRoot, engine }) => {
      const root = tmpDir().name;
      await GitTestUtils.createRepoWithReadme(root);

      engine.config.vaults.push({
        fsPath: "remoteVault",
        remote: {
          type: "git",
          url: root,
        },
      });
      engine.config.initializeRemoteVaults = false;
      DConfig.writeConfig({ wsRoot, config: engine.config });
      const ws = new WorkspaceService({ wsRoot });
      const didClone = await ws.initialize({
        onSyncVaultsProgress: () => {},
        onSyncVaultsEnd: () => {},
      });
      expect(didClone).toBeFalsy();
      expect(
        fs.existsSync(path.join(wsRoot, "remoteVault", "README.md"))
      ).toBeFalsy();
    }
  );

  testWithEngine(
    "commitAll",
    async ({ wsRoot, vaults }) => {
      await NoteTestUtilsV4.modifyNoteByPath(
        { wsRoot, vault: vaults[0], fname: "foo" },
        (note: NoteProps) => {
          note.body = note.body + "\n Foo";
          return note;
        }
      );
      await NoteTestUtilsV4.createNote({
        fname: "bar",
        vault: vaults[1],
        wsRoot,
      });
      const resp = await new WorkspaceService({ wsRoot }).commidAndAddAll();
      expect(resp.length).toEqual(2);
    },
    { initGit: true }
  );
});
