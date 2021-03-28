import { tmpDir } from "@dendronhq/common-server";
import { DConfig, WorkspaceService } from "@dendronhq/engine-server";
import { testWithEngine } from "../../engine";
import { GitTestUtils } from "../../utils";
import fs from "fs-extra";
import path from "path";

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
});
