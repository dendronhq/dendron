import {
  WorkspaceCLICommand,
  WorkspaceCLICommandOpts,
  WorkspaceCommands,
} from "@dendronhq/dendron-cli";
import { getCachePath } from "@dendronhq/engine-server";
import fs from "fs-extra";
import { vault2Path } from "../../../../../common-server/lib";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";

const runCmd = (opts: Omit<WorkspaceCLICommandOpts, "port" | "server">) => {
  const cmd = new WorkspaceCLICommand();
  return cmd.execute({ ...opts, port: 0, server: {} as any });
};

describe("clean cache cmd", () => {
  test("basic", async () => {
    const cmd = WorkspaceCommands.REMOVE_CACHE;

    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        expect(
          Promise.all(
            vaults.map((vault) => {
              return fs.pathExists(getCachePath(vault2Path({ wsRoot, vault })));
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
