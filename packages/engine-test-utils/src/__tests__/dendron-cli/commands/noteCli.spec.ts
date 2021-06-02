import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "../../../presets";
import {
  NoteCLICommand,
  NoteCLICommandOpts,
  NoteCommands,
} from "@dendronhq/dendron-cli";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";

const runCmd = (opts: Omit<NoteCLICommandOpts, "port" | "server">) => {
  const cmd = new NoteCLICommand();
  cmd.opts.quiet = true;
  return cmd.execute({ ...opts, port: 0, server: {} as any });
};

describe(NoteCommands.LOOKUP, () => {
  const cmd = NoteCommands.LOOKUP;

  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runCmd({
          wsRoot,
          vault: VaultUtils.getName(vault),
          engine,
          cmd,
          query: "gamma",
        });
        expect(
          NoteUtils.getNoteOrThrow({
            fname: "gamma",
            vault,
            notes: engine.notes,
            wsRoot,
          })
        ).toBeTruthy();
      },
      {
        createEngine: createEngineFromServer,
        expect,
      }
    );
  });

  test("multi", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[1];
        await runCmd({
          wsRoot,
          vault: VaultUtils.getName(vault),
          engine,
          cmd,
          query: "gamma",
        });
        expect(
          NoteUtils.getNoteOrThrow({
            fname: "gamma",
            vault,
            notes: engine.notes,
            wsRoot,
          })
        ).toBeTruthy();
      },
      {
        createEngine: createEngineFromServer,
        expect,
      }
    );
  });
});

describe(NoteCommands.DELETE, () => {
  const cmd = NoteCommands.DELETE;

  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runCmd({
          wsRoot,
          vault: VaultUtils.getName(vault),
          engine,
          cmd,
          query: "foo.ch1",
        });
        expect(engine.notes["foo.ch1"]).toBeUndefined();
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("multi", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[1];
        await runCmd({
          wsRoot,
          vault: VaultUtils.getName(vault),
          engine,
          cmd,
          query: "bar",
        });
        expect(engine.notes["bar"]).toBeUndefined();
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
      }
    );
  });
});
