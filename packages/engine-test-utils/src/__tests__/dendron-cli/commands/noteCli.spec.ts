import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "../../../presets";
import {
  NoteCLICommand,
  NoteCLICommandOpts,
  NoteCLIOutput,
  NoteCommands,
} from "@dendronhq/dendron-cli";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";
import { checkString } from "../../../utils";

const runCmd = (opts: Omit<NoteCLICommandOpts, "port" | "server">) => {
  const cmd = new NoteCLICommand();
  cmd.opts.quiet = true;
  return cmd.execute({ ...opts, port: 0, server: {} as any });
};

describe("WHEN run 'dendron note lookup'", () => {
  const cmd = NoteCommands.LOOKUP;

  describe("AND WHEN lookup note with no vault specified", () => {
    test("THEN get note in first vault", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[0];
          await runCmd({
            wsRoot,
            vault: VaultUtils.getName(vault),
            engine,
            cmd,
            query: "gamma",
            output: NoteCLIOutput.JSON,
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

  describe("AND WHEN lookup note with no vault specified and --output = markdown_dendron", () => {
    test("THEN get note in first vault", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[0];
          const { data } = await runCmd({
            wsRoot,
            vault: VaultUtils.getName(vault),
            engine,
            cmd,
            query: "foo",
            output: NoteCLIOutput.MARKDOWN_DENDRON,
          });
          expect(data.payload).toMatchSnapshot();
          await checkString(data.payload, "---\nfoo body");
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("WHEN specify vault", () => {
    test("THEN get note in specified vault", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[1];
          await runCmd({
            wsRoot,
            vault: VaultUtils.getName(vault),
            engine,
            cmd,
            query: "gamma",
            output: NoteCLIOutput.JSON,
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
});

describe("WHEN run 'dendron note delete", () => {
  const cmd = NoteCommands.DELETE;
  describe("WHEN lookup note with no vault specified", () => {
    test("THEN delete note in first available vault", async () => {
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
  });

  describe("WHEN specify vault", () => {
    test("delete note in specific vault", async () => {
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
});
