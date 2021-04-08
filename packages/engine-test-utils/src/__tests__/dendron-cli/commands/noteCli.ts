import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
import {
  NoteCLICommand,
  NoteCLICommandOpts,
  NoteCommands,
} from "@dendronhq/dendron-cli";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";

const runCmd = (opts: Omit<NoteCLICommandOpts, "port" | "server">) => {
  const cmd = new NoteCLICommand();
  return cmd.execute({ ...opts, port: 0, server: {} as any });
};

describe(NoteCommands.LOOKUP, () => {
  const cmd = NoteCommands.LOOKUP;

  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const resp = await runCmd({
          wsRoot,
          vault: VaultUtils.getName(vault),
          engine,
          cmd,
          query: "gamma",
        });
        expect(resp?.note?.fname).toEqual("gamma");
        expect(
          NoteUtils.getNoteOrThrow({
            fname: "gamma",
            vault,
            notes: engine.notes,
            wsRoot,
          })
        ).toEqual(resp?.note);
      },
      {
        createEngine: createEngineFromServer,
        expect,
      }
    );
  });
});
