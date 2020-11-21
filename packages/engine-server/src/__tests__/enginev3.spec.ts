import {
  DEngineV2,
  DNodeUtilsV2,
  DVault,
  NotePropsV2,
  NoteUtilsV2,
  SchemaModulePropsV2,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  EngineTestUtilsV3,
  ENGINE_SERVER,
  NodeTestPresetsV2,
  runEngineTest,
  runJestHarnessV2,
  TestResult,
} from "@dendronhq/common-test-utils";
import { NotePresetsUtils } from "@dendronhq/common-test-utils/lib/presets/utils";
import fs from "fs-extra";
import _ from "lodash";
import { DendronEngineV2 } from "../enginev2";

const { INIT } = ENGINE_SERVER.ENGINE_MULTI_TEST_PRESET;

const setupCase1 = async () => {
  const vaults = await EngineTestUtilsV3.setupVaults({
    initVault1: async (vaultDir: string) => {
      await NotePresetsUtils.createBasic({ vaultDir, fname: "foo" });
    },
    initVault2: async (vaultDir: string) => {
      await NotePresetsUtils.createBasic({ vaultDir, fname: "bar" });
    },
  });
  const engine = DendronEngineV2.createV3({ vaults });
  return { vaults, engine };
};

const createEngine = ({ vaults }: WorkspaceOpts) => {
  return DendronEngineV2.createV3({ vaults });
};

describe("engine, notes/", () => {
  describe("write/", () => {
    test("add domain to second vault", async () => {
      await runEngineTest(
        async ({ engine, vaults }) => {
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
              expected: 2,
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
    // @ts-ignore
    let vaults: DVault[];
    let engine: DEngineV2;

    beforeEach(async () => {
      ({ vaults, engine } = await setupCase1());
    });

    test("basic/", async () => {
      await engine.init();
      // check schema correct
      expect(_.size(engine.schemas)).toEqual(3);
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
          fname: "bar.ch1",
          vault: vaults[1],
        },
        {
          fname: "foo",
          vault: vaults[0],
        },
        {
          fname: "foo.ch1",
          vault: vaults[0],
        },
      ]);
      const dir1 = fs.readdirSync(vaults[0].fsPath);
      const dir2 = fs.readdirSync(vaults[1].fsPath);
      expect(dir1).toMatchSnapshot("dir1");
      expect(dir2).toMatchSnapshot("dir2");
    });

    test("with stubs/", async () => {
      await INIT.WITH_STUBS.before({ vault: vaults[0] });
      await engine.init();
      await NodeTestPresetsV2.runJestHarness({
        opts: { notes: engine.notes, vault: vaults[0] },
        results: INIT.WITH_STUBS.results,
        expect,
      });
    });
  });
});
