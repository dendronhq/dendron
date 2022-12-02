import {
  VaultCLICommand,
  VaultCLICommandOpts,
  VaultCommands,
} from "@dendronhq/dendron-cli";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";
import { checkVaults } from "../../../utils";

const runCmd = (opts: Omit<VaultCLICommandOpts, "port" | "server">) => {
  const cmd = new VaultCLICommand();
  return cmd.execute({ ...opts, port: 0, server: {} as any });
};

describe("VaultCLICommand", () => {
  test("basic", async () => {
    const cmd = VaultCommands.CREATE;

    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const { vault } = await runCmd({
          wsRoot,
          vaultPath: "testVault",
          engine,
          cmd,
        });
        if (vault) vaults.unshift(vault);
        await checkVaults(
          {
            wsRoot,
            vaults,
          },
          expect
        );
        return;
      },
      {
        createEngine: createEngineFromServer,
        expect,
      }
    );
  });
});
