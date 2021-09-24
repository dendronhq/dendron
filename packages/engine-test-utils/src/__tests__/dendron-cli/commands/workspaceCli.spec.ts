import { tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  WorkspaceCLICommand,
  WorkspaceCLICommandOpts,
  WorkspaceCommands,
} from "@dendronhq/dendron-cli";
import { getCachePath } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import { GitTestUtils, setupWS } from "../../..";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";
import { checkFile } from "../../../utils";

const runCmd = (opts: Omit<WorkspaceCLICommandOpts, "port" | "server">) => {
  const cmd = new WorkspaceCLICommand();
  return cmd.execute({ ...opts, port: 0, server: {} as any });
};

describe("GIVEN workspace", () => {
  const cmd = WorkspaceCommands.INIT;
  describe("WHEN run 'dendron init'", () => {
    describe("AND with regular vault", () => {
      test("THEN do not clone vaults", async () => {
        const { wsRoot } = await setupWS({ vaults: [{ fsPath: "vault1" }] });
        const resp = await runCmd({ wsRoot, cmd });
        expect(resp.data).toBeFalsy();
      });
    });

    describe("AND with remote vault", () => {
      test("THEN clone vault", async () => {
        const root = tmpDir().name;
        await GitTestUtils.createRepoWithReadme(root);

        const { wsRoot } = await setupWS({
          vaults: [
            {
              fsPath: "vault1",
              remote: {
                type: "git",
                url: root,
              },
            },
          ],
        });
        // remove vault to force initialization
        fs.removeSync(path.join(wsRoot, "vault1"));
        const resp = await runCmd({ wsRoot, cmd });

        expect(resp.data).toBeTruthy();
        await checkFile({ fpath: path.join(wsRoot, "vault1", "README.md") });
      });
    });

    describe("AND with remote workspace vault", () => {
      test("THEN clone workspace vault", async () => {
        const root = tmpDir().name;
        await GitTestUtils.createRepoWithReadme(root);
        const workspaceName = "foo";
        const vaultName = "vault1";

        const { wsRoot } = await setupWS({
          vaults: [
            {
              fsPath: vaultName,
              workspace: workspaceName,
              remote: {
                type: "git",
                url: root,
              },
            },
          ],
        });
        // remove vault to force initialization
        fs.removeSync(path.join(wsRoot, workspaceName));
        const resp = await runCmd({ wsRoot, cmd });

        expect(resp.data).toBeTruthy();
        await checkFile({
          fpath: path.join(wsRoot, workspaceName, vaultName, "README.md"),
        });
      });
    });
  });

  describe("WHEN run 'remove_cache'", () => {
    test("THEN remove cache", async () => {
      const cmd = WorkspaceCommands.REMOVE_CACHE;

      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          expect(
            Promise.all(
              vaults.map((vault) => {
                return fs.pathExists(
                  getCachePath(vault2Path({ wsRoot, vault }))
                );
              })
            )
          ).toBeTruthy();
          await runCmd({
            wsRoot,
            engine,
            cmd,
          });
          expect(
            Promise.all(
              vaults.map((vault) => {
                return !fs.pathExists(
                  getCachePath(vault2Path({ wsRoot, vault }))
                );
              })
            )
          ).toBeTruthy();
        },
        {
          createEngine: createEngineFromServer,
          expect,
        }
      );
    });
  });
});
