import { VaultUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  NoteCLICommand,
  NoteCLICommandOpts,
  NoteCLIOutput,
  NoteCommandData,
  NoteCommands,
} from "@dendronhq/dendron-cli";
import _ from "lodash";
import {
  createEngineFromServer,
  createEngineV3FromEngine,
  runEngineTestV5,
} from "../../../engine";
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

const runLookupLegacyCmd = (
  opts: Omit<NoteCLICommandOpts, "port" | "server" | "cmd">
) => {
  const cmd = new NoteCLICommand();
  cmd.opts.quiet = true;
  return cmd.execute({
    ...opts,
    cmd: NoteCommands.LOOKUP_LEGACY,
    port: 0,
    server: {} as any,
  }) as Promise<{ data: NoteCommandData }>;
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
    output: NoteCLIOutput.JSON,
  }) as Promise<{ data: NoteCommandData }>;
};

describe("WHEN run 'dendron note lookup'", () => {
  describe("AND WHEN find note that doesn't exist", () => {
    test("THEN return empty result", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[0];
          const {
            data: { notesOutput },
          } = await runLookupCmd({
            wsRoot,
            engine,
            query: "gamma",
            output: NoteCLIOutput.JSON,
          });
          expect(notesOutput).toEqual([]);
          const note = (
            await engine.findNotesMeta({
              fname: "gamma",
              vault,
            })
          )[0];
          // note not created
          expect(note).toBeUndefined();
        },
        {
          createEngine: createEngineV3FromEngine,
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
          } = await runLookupCmd({
            wsRoot,
            engine,
            query: "foo.ch1",
          });
          expect(_.map(notesOutput, (n) => n.fname)).toEqual(["foo.ch1"]);
        },
        {
          expect,
          createEngine: createEngineV3FromEngine,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("AND WHEN single match using wikilink", () => {
    test("THEN return match", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const {
            data: { notesOutput },
          } = await runLookupCmd({
            wsRoot,
            engine,
            query: "[[foo.ch1]]",
          });
          expect(_.map(notesOutput, (n) => n.fname)).toEqual(["foo.ch1"]);
        },
        {
          expect,
          createEngine: createEngineV3FromEngine,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("AND WHEN single match using cross vault wikilink of matching vault", () => {
    test("THEN return match", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const {
            data: { notesOutput },
          } = await runLookupCmd({
            wsRoot,
            engine,
            query: `[[dendron://${VaultUtils.getName(
              engine.vaults[0]
            )}/foo.ch1]]`,
          });
          expect(_.map(notesOutput, (n) => n.fname)).toEqual(["foo.ch1"]);
        },
        {
          expect,
          createEngine: createEngineV3FromEngine,
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
          } = await runLookupCmd({
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
          createEngine: createEngineV3FromEngine,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
});

describe("WHEN run 'dendron note get'", () => {
  const cmd = NoteCommands.GET;
  describe("AND WHEN get note that doesn't exist", () => {
    test("THEN return empty result", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const resp = await runCmd({
            wsRoot,
            engine,
            cmd,
            query: "gamma",
            output: NoteCLIOutput.JSON,
          });
          expect(resp.data).toBeUndefined();
          expect(resp.error?.message).toContain("gamma does not exist");
          const note = (await engine.getNote("gamma")).data;
          // note not created
          expect(note).toBeUndefined();
        },
        {
          createEngine: createEngineV3FromEngine,
          expect,
        }
      );
    });
  });

  describe("AND WHEN find note with single matches", () => {
    test("THEN return one matches", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const resp = await runCmd({
            wsRoot,
            engine,
            cmd,
            query: "foo.ch1",
          });
          const noteData = resp.data as NoteCommandData;
          expect(_.map(noteData.notesOutput, (n) => n.fname)).toEqual([
            "foo.ch1",
          ]);
        },
        {
          expect,
          createEngine: createEngineV3FromEngine,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
});

describe("WHEN run 'dendron note find'", () => {
  const cmd = NoteCommands.FIND;
  describe("AND WHEN find note that doesn't exist", () => {
    test("THEN return empty result", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const { data } = (await runCmd({
            wsRoot,
            engine,
            cmd,
            fname: "gamma",
            output: NoteCLIOutput.JSON,
          })) as { data: NoteCommandData };
          expect(data.notesOutput).toEqual([]);
          const note = (await engine.getNote("gamma")).data;
          // note not created
          expect(note).toBeUndefined();
        },
        {
          createEngine: createEngineV3FromEngine,
          expect,
        }
      );
    });
  });

  describe("AND WHEN find note with single matches", () => {
    test("THEN return one matches", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const { data } = (await runCmd({
            wsRoot,
            engine,
            cmd,
            fname: "foo.ch1",
            output: NoteCLIOutput.JSON,
          })) as { data: NoteCommandData };
          expect(_.map(data.notesOutput, (n) => n.fname)).toEqual(["foo.ch1"]);
        },
        {
          expect,
          createEngine: createEngineV3FromEngine,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("AND WHEN find note with multiple matches", () => {
    test("THEN return multiple matches", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const { data } = (await runCmd({
            wsRoot,
            engine,
            cmd,
            fname: "root",
            output: NoteCLIOutput.JSON,
          })) as { data: NoteCommandData };
          expect(_.map(data.notesOutput, (n) => n.fname)).toEqual([
            "root",
            "root",
            "root",
          ]);
        },
        {
          expect,
          createEngine: createEngineV3FromEngine,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("AND WHEN find note with fname and vault", () => {
    test("THEN return multiple matches", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const { data } = (await runCmd({
            wsRoot,
            engine,
            cmd,
            fname: "root",
            vault: vaults[1].fsPath,
            output: NoteCLIOutput.JSON,
          })) as { data: NoteCommandData };
          expect(data.notesOutput.length).toEqual(1);
          expect(data.notesOutput[0].vault.fsPath).toEqual(vaults[1].fsPath);
          expect(data.notesOutput[0].fname).toEqual("root");
        },
        {
          expect,
          createEngine: createEngineV3FromEngine,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("AND WHEN find note with vault", () => {
    test("THEN return all notes in vault", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const { data } = (await runCmd({
            wsRoot,
            engine,
            cmd,
            vault: vaults[0].fsPath,
            output: NoteCLIOutput.JSON,
          })) as { data: NoteCommandData };
          expect(data.notesOutput.length).toEqual(4);
        },
        {
          expect,
          createEngine: createEngineV3FromEngine,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
});

describe("WHEN run 'dendron note lookup_legacy'", () => {
  const cmd = NoteCommands.LOOKUP_LEGACY;

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
            await engine.findNotesMeta({
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
          } = await runLookupLegacyCmd({
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
          } = await runLookupLegacyCmd({
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
              await engine.findNotesMeta({
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

  describe("WHEN specify vault", () => {
    test("delete note in specific vault", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[1];
          const before = (
            await engine.findNotesMeta({ fname: "bar", vault })
          )[0];
          expect(before.fname).toEqual("bar");
          await runCmd({
            wsRoot,
            vault: VaultUtils.getName(vault),
            engine,
            cmd,
            fname: "bar",
          });
          const after = await engine.findNotesMeta({ fname: "bar", vault });
          expect(after.length).toEqual(0);
        },
        {
          createEngine: createEngineV3FromEngine,
          expect,
          preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        }
      );
    });
  });

  describe("WHEN note doesn't exist", () => {
    test("THEN error is returned", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[1];
          const resp = await runCmd({
            wsRoot,
            vault: VaultUtils.getName(vault),
            engine,
            cmd,
            fname: "blahblah",
          });
          expect(resp.error?.message).toEqual("note blahblah not found");
        },
        {
          createEngine: createEngineV3FromEngine,
          expect,
          preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        }
      );
    });
  });
});

describe("WHEN run 'dendron note write", () => {
  const cmd = NoteCommands.WRITE;

  describe("WHEN specify vault", () => {
    test("write note in specific vault", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[1];
          await runCmd({
            wsRoot,
            vault: VaultUtils.getName(vault),
            engine,
            cmd,
            fname: "newbar",
            body: "this is body of newbar",
          });
          const after = await engine.findNotes({ fname: "newbar", vault });
          expect(after.length).toEqual(1);
          expect(after[0].body).toEqual("this is body of newbar");
        },
        {
          createEngine: createEngineV3FromEngine,
          expect,
          preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        }
      );
    });
  });

  describe("WHEN note already exist", () => {
    test("THEN update note", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[1];
          const before = (await engine.findNotes({ fname: "bar", vault }))[0];
          await runCmd({
            wsRoot,
            vault: VaultUtils.getName(vault),
            engine,
            cmd,
            fname: "bar",
            body: "updateBody",
          });
          const after = (await engine.findNotes({ fname: "bar", vault }))[0];
          expect(after.body).toEqual("updateBody");
          expect(before.fname).toEqual(after.fname);
          expect(before.vault).toEqual(after.vault);
        },
        {
          createEngine: createEngineV3FromEngine,
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
            fname: "foo",
            destFname: "moved-note",
          });
          expect(
            (
              await engine.findNotesMeta({
                fname: "moved-note",
                vault,
              })
            )[0]
          ).toBeTruthy();
        },
        {
          createEngine: createEngineV3FromEngine,
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
            fname: "bar",
            destFname: "moved-note",
          });
          expect(
            (
              await engine.findNotesMeta({
                fname: "moved-note",
                vault,
              })
            )[0]
          ).toBeTruthy();
        },
        {
          createEngine: createEngineV3FromEngine,
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
            fname: "bar",
            destFname: "car",
            destVaultName: VaultUtils.getName(otherVault),
          });
          expect(
            (
              await engine.findNotesMeta({
                fname: "car",
                vault: otherVault,
              })
            )[0]
          ).toBeTruthy();
        },
        {
          createEngine: createEngineV3FromEngine,
          expect,
          preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        }
      );
    });
  });
});
