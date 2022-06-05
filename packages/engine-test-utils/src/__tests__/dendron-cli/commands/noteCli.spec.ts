import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  NoteCLICommand,
  NoteCLICommandOpts,
  NoteCLIOutput,
  NoteCommandData,
  NoteCommands,
} from "@dendronhq/dendron-cli";
import _ from "lodash";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "../../../presets";
import { checkString } from "../../../utils";

const runCmd = (opts: Omit<NoteCLICommandOpts, "port" | "server">) => {
  const cmd = new NoteCLICommand();
  cmd.opts.quiet = true;
  return cmd.execute({
    ...opts,
    port: 0,
    server: {} as any,
    output: NoteCLIOutput.JSON,
  });
};

const runLookupCmd = (
  opts: Omit<NoteCLICommandOpts, "port" | "server" | "cmd">
) => {
  const cmd = new NoteCLICommand();
  cmd.opts.quiet = true;
  return cmd.execute({
    ...opts,
    cmd: NoteCommands.LOOKUP,
    port: 0,
    server: {} as any,
  }) as Promise<{ data: NoteCommandData }>;
};

const runFindCmd = (
  opts: Omit<NoteCLICommandOpts, "port" | "server" | "cmd">
) => {
  const cmd = new NoteCLICommand();
  cmd.opts.quiet = true;
  return cmd.execute({
    ...opts,
    cmd: NoteCommands.FIND,
    port: 0,
    server: {} as any,
    output: NoteCLIOutput.JSON,
  }) as Promise<{ data: NoteCommandData }>;
};

describe("WHEN run 'dendron note find'", () => {
  describe("AND WHEN find note that doesn't exist", () => {
    test("THEN return empty result", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[0];
          const {
            data: { notesOutput },
          } = await runFindCmd({
            wsRoot,
            engine,
            query: "gamma",
            output: NoteCLIOutput.JSON,
          });
          expect(notesOutput).toEqual([]);
          const note = NoteUtils.getNoteByFnameFromEngine({
            fname: "gamma",
            vault,
            engine,
          });
          // note not created
          expect(note).toBeUndefined();
        },
        {
          createEngine: createEngineFromServer,
          expect,
        }
      );
    });
  });

  describe("AND WHEN find note with single matches", () => {
    test("THEN return one matches", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const {
            data: { notesOutput },
          } = await runFindCmd({
            wsRoot,
            engine,
            query: "foo.ch1",
          });
          expect(_.map(notesOutput, (n) => n.fname)).toEqual(["foo.ch1"]);
        },
        {
          expect,
          createEngine: createEngineFromServer,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("AND WHEN find note with multiple matches", () => {
    test("THEN return all matches", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const {
            data: { notesOutput },
          } = await runFindCmd({
            wsRoot,
            engine,
            query: "foo",
          });
          expect(_.map(notesOutput, (n) => n.fname)).toEqual([
            "foo",
            "foo.ch1",
          ]);
        },
        {
          expect,
          createEngine: createEngineFromServer,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
});

describe("WHEN run 'dendron note lookup'", () => {
  const cmd = NoteCommands.LOOKUP;

  describe("AND WHEN lookup note that doesn't exist in specified vault", () => {
    test("THEN lookup creates new note in specified vault", async () => {
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
          const note = (
            await engine.findNotes({
              fname: "gamma",
              vault,
            })
          )[0];
          expect(note).toBeTruthy();
          expect(_.pick(note, ["title", "vault"])).toEqual({
            title: "Gamma",
            vault: { fsPath: "vault1" },
          });
        },
        {
          createEngine: createEngineFromServer,
          expect,
        }
      );
    });
  });

  describe("AND WHEN lookup note and --output = markdown_dendron", () => {
    test("THEN get note body in markdown_dendron", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[0];
          const {
            data: { stringOutput },
          } = await runLookupCmd({
            wsRoot,
            vault: VaultUtils.getName(vault),
            engine,
            query: "foo",
            output: NoteCLIOutput.MARKDOWN_DENDRON,
          });
          expect(stringOutput).toMatchSnapshot();
          await checkString(stringOutput, "---\nfoo body");
        },
        {
          expect,
          createEngine: createEngineFromServer,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("AND WHEN lookup note with no vault specified and --output = md_gfm", () => {
    test("THEN get note body in mardkown_gfm", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[0];
          const {
            data: { stringOutput },
          } = await runLookupCmd({
            wsRoot,
            vault: VaultUtils.getName(vault),
            engine,
            query: "foo",
            output: NoteCLIOutput.MARKDOWN_GFM,
          });
          expect(stringOutput).toMatchSnapshot();
          await checkString(stringOutput, "foo.ch1 body");
        },
        {
          expect,
          createEngine: createEngineFromServer,
          preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            await ENGINE_HOOKS.setupBasic(opts);
            NoteTestUtilsV4.modifyNoteByPath(
              { wsRoot, vault: vaults[0], fname: "foo" },
              (note) => {
                note.body = "![[foo.ch1]]";
                return note;
              }
            );
          },
        }
      );
    });
  });

  describe("WHEN lookup note that exists in specified vault", () => {
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
            (
              await engine.findNotes({
                fname: "gamma",
                vault,
              })
            )[0]
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

describe("WHEN run 'dendron note move'", () => {
  const cmd = NoteCommands.MOVE;

  describe("WHEN lookup note with no vault specified and no new vault specified", () => {
    test("THEN move note within first available vault", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[0];
          await runCmd({
            wsRoot,
            vault: VaultUtils.getName(vault),
            engine,
            cmd,
            query: "foo",
            destFname: "moved-note",
          });
          expect(
            (
              await engine.findNotes({
                fname: "moved-note",
                vault,
              })
            )[0]
          ).toBeTruthy();
        },
        {
          createEngine: createEngineFromServer,
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("WHEN specify vault and no new vault specified", () => {
    test("THEN move note within specific vault", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[1];
          await runCmd({
            wsRoot,
            vault: VaultUtils.getName(vault),
            engine,
            cmd,
            query: "bar",
            destFname: "moved-note",
          });
          expect(
            (
              await engine.findNotes({
                fname: "moved-note",
                vault,
              })
            )[0]
          ).toBeTruthy();
        },
        {
          createEngine: createEngineFromServer,
          expect,
          preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        }
      );
    });
  });

  describe("WHEN specify vault and new vault", () => {
    test("THEN move note within specific vault to new vault", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[1];
          const otherVault = vaults[2];
          await runCmd({
            wsRoot,
            vault: VaultUtils.getName(vault),
            engine,
            cmd,
            query: "bar",
            destFname: "car",
            destVaultName: VaultUtils.getName(otherVault),
          });
          expect(
            (
              await engine.findNotes({
                fname: "car",
                vault: otherVault,
              })
            )[0]
          ).toBeTruthy();
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
