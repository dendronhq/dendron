import {
  DNodeUtilsV2,
  NotePropsV2,
  NoteUtilsV2,
  SchemaModulePropsV2,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  ENGINE_SERVER,
  FileTestUtils,
  NodeTestPresetsV2,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
  runEngineTestV4,
  runJestHarnessV2,
  SetupHookFunction,
  TestResult,
} from "@dendronhq/common-test-utils";
import _ from "lodash";
import { DendronEngineV2 } from "../enginev2";

const { INIT } = ENGINE_SERVER.ENGINE_MULTI_TEST_PRESET;

const createEngine = ({ wsRoot, vaults }: WorkspaceOpts) => {
  return DendronEngineV2.createV3({ wsRoot, vaults });
};

const preSetupHook: SetupHookFunction = async ({ vaults, wsRoot }) => {
  await NoteTestUtilsV4.createNote({ fname: "foo", vault: vaults[0], wsRoot });
  await NoteTestUtilsV4.createSchema({
    fname: "foo",
    vault: vaults[0],
    wsRoot,
  });
  await NoteTestUtilsV4.createNote({ fname: "bar", vault: vaults[1], wsRoot });
  await NoteTestUtilsV4.createSchema({
    fname: "bar",
    vault: vaults[1],
    wsRoot,
  });
};

describe("engine, notes/", () => {
  describe("rename/", async () => {
    const preSetupHook: SetupHookFunction = async ({ vaults, wsRoot }) => {
      await NOTE_PRESETS_V4.NOTE_WITH_TARGET({ vault: vaults[0], wsRoot });
      await NOTE_PRESETS_V4.NOTE_WITH_LINK({ vault: vaults[1], wsRoot });
    };

    test("target in vault1, link in vault2", async () => {
      await runEngineTestV4(
        async ({ wsRoot, vaults, engine }) => {
          const resp = await engine.renameNote({
            oldLoc: { fname: "alpha", vault: vaults[0] },
            newLoc: { fname: "gamma", vault: vaults[0] },
          });

          // chekc what notes changed
          const changed = resp.data;
          const updated = _.map(changed, (ent) => ({
            status: ent.status,
            fname: ent.note.fname,
          })).sort();

          const checkVault1 = await FileTestUtils.assertInVault({
            vault: vaults[0],
            wsRoot,
            match: ["gamma"],
            nomatch: ["alpha"],
          });
          const checkVault2 = await FileTestUtils.assertInVault({
            vault: vaults[1],
            wsRoot,
            match: ["beta"],
            nomatch: ["alpha", "gamma"],
          });
          const scenarios = [
            {
              actual: updated,
              expected: [
                { status: "update", fname: "beta" },
                { status: "delete", fname: "alpha" },
                { status: "create", fname: "gamma" },
              ],
            },
            {
              actual: checkVault1,
              expected: true,
            },
            {
              actual: checkVault2,
              expected: true,
            },
          ];
          await runJestHarnessV2(scenarios, expect);
        },
        {
          createEngine,
          preSetupHook,
        }
      );
    });

    test("target in vault2, link vault2", async () => {
      await runEngineTestV4(
        async ({ wsRoot, vaults, engine }) => {
          const resp = await engine.renameNote({
            oldLoc: { fname: "alpha", vault: vaults[1] },
            newLoc: { fname: "gamma", vault: vaults[1] },
          });

          // chekc what notes changed
          const changed = resp.data;
          const updated = _.map(changed, (ent) => ({
            status: ent.status,
            fname: ent.note.fname,
          })).sort();

          const checkVault1 = await FileTestUtils.assertInVault({
            vault: vaults[0],
            wsRoot,
            nomatch: ["alpha", "gamma"],
          });
          const checkVault2 = await FileTestUtils.assertInVault({
            vault: vaults[1],
            wsRoot,
            match: ["beta", "gamma"],
            nomatch: ["alpha"],
          });
          const scenarios = [
            {
              actual: updated,
              expected: [
                { status: "update", fname: "beta" },
                { status: "delete", fname: "alpha" },
                { status: "create", fname: "gamma" },
              ],
            },
            {
              actual: checkVault1,
              expected: true,
            },
            {
              actual: checkVault2,
              expected: true,
            },
          ];
          await runJestHarnessV2(scenarios, expect);
        },
        {
          createEngine,
          preSetupHook: async ({ vaults, wsRoot }) => {
            await NOTE_PRESETS_V4.NOTE_WITH_TARGET({
              vault: vaults[1],
              wsRoot,
            });
            await NOTE_PRESETS_V4.NOTE_WITH_LINK({ vault: vaults[1], wsRoot });
          },
        }
      );
    });

    test("target in vault2, link vault1", async () => {
      await runEngineTestV4(
        async ({ wsRoot, vaults, engine }) => {
          const resp = await engine.renameNote({
            oldLoc: { fname: "alpha", vault: vaults[1] },
            newLoc: { fname: "gamma", vault: vaults[1] },
          });

          // chekc what notes changed
          const changed = resp.data;
          const updated = _.map(changed, (ent) => ({
            status: ent.status,
            fname: ent.note.fname,
          })).sort();

          const checkVault1 = await FileTestUtils.assertInVault({
            vault: vaults[0],
            wsRoot,
            match: ["beta"],
          });
          const checkVault2 = await FileTestUtils.assertInVault({
            vault: vaults[1],
            wsRoot,
            match: ["gamma"],
            nomatch: ["alpha"],
          });
          const scenarios = [
            {
              actual: updated,
              expected: [
                { status: "update", fname: "beta" },
                { status: "delete", fname: "alpha" },
                { status: "create", fname: "gamma" },
              ],
            },
            {
              actual: checkVault1,
              expected: true,
            },
            {
              actual: checkVault2,
              expected: true,
            },
          ];
          await runJestHarnessV2(scenarios, expect);
        },
        {
          createEngine,
          preSetupHook: async ({ vaults, wsRoot }) => {
            await NOTE_PRESETS_V4.NOTE_WITH_TARGET({
              vault: vaults[1],
              wsRoot,
            });
            await NOTE_PRESETS_V4.NOTE_WITH_LINK({ vault: vaults[0], wsRoot });
          },
        }
      );
    });
  });

  describe("write/", async () => {
    test("add domain to second vault", async () => {
      await runEngineTestV4(
        async ({ vaults, engine }) => {
          let note = NoteUtilsV2.create({ fname: "alpha", vault: vaults[1] });
          await engine.writeNote(note);
          const root = NoteUtilsV2.getNotesByFname({
            fname: "root",
            notes: engine.notes,
            vault: vaults[1],
          })[0] as NotePropsV2;
          const newNote = NoteUtilsV2.getNotesByFname({
            fname: "alpha",
            notes: engine.notes,
            vault: vaults[1],
          })[0] as NotePropsV2;
          const results = [
            {
              actual: root.children.length,
              expected: 1,
            },
            {
              actual: newNote.parent,
              expected: root.id,
            },
          ] as TestResult[];
          await runJestHarnessV2(results, expect);
        },
        {
          createEngine,
        }
      );
    });
  });

  describe("init/", () => {
    test("basic", async () => {
      await runEngineTestV4(
        async ({ vaults, engine }) => {
          expect(vaults.map((ent) => ent.fsPath)).toEqual(["vault1", "vault2"]);
          expect(
            _.map(
              _.reject(
                _.values(engine.schemas),
                DNodeUtilsV2.isRoot
              ) as SchemaModulePropsV2[],
              ({ fname, vault }) => ({
                fname,
                vault,
              })
            ).sort()
          ).toEqual([
            {
              fname: "bar",
              vault: vaults[1],
            },
            {
              fname: "foo",
              vault: vaults[0],
            },
          ]);
          // check note correct
          expect(
            _.sortBy(
              _.reject(
                _.map(_.values(engine.notes), ({ fname, vault }) => ({
                  fname,
                  vault,
                })),
                DNodeUtilsV2.isRoot
              ),
              ["fname"]
            )
          ).toEqual([
            {
              fname: "bar",
              vault: vaults[1],
            },
            {
              fname: "foo",
              vault: vaults[0],
            },
          ]);
        },
        { createEngine, preSetupHook }
      );
    });

    test("with stubs/", async () => {
      await runEngineTestV4(
        async ({ vaults, engine }) => {
          await NodeTestPresetsV2.runJestHarness({
            opts: { notes: engine.notes, vault: vaults[0] },
            results: INIT.WITH_STUBS.results,
            expect,
          });
        },
        {
          createEngine,
          preSetupHook: async ({ vaults, wsRoot }) => {
            await INIT.WITH_STUBS.before({ vault: vaults[0], wsRoot });
          },
        }
      );
    });
  });
});
