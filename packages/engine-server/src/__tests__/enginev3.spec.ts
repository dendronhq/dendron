import { DEngineV2, DVault } from "@dendronhq/common-all";
import { EngineTestUtilsV3 } from "@dendronhq/common-test-utils";
import { NotePresetsUtils } from "@dendronhq/common-test-utils/lib/presets/utils";
import fs from "fs-extra";
import { DendronEngineV2 } from "../enginev2";

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

describe("engine, notes/", () => {
  describe("init/", () => {
    // @ts-ignore
    let vaults: DVault[];
    let engine: DEngineV2;

    beforeEach(async () => {
      ({ vaults, engine } = await setupCase1());
    });

    test("basic/", async () => {
      await engine.init();
      // expect(engine.notes).toMatchSnapshot();
      // expect(engine.schemas).toMatchSnapshot();
      const dir1 = fs.readdirSync(vaults[0].fsPath);
      const dir2 = fs.readdirSync(vaults[1].fsPath);
      expect(dir1).toMatchSnapshot();
      expect(dir2).toMatchSnapshot();
    });

    // test(NOTE_INIT_PRESET.domainStub.label, async () => {
    //   await NOTE_INIT_PRESET.domainStub.before({ vaultDir });
    //   await engine.init();
    //   const notes = engine.notes;
    //   await NodeTestPresetsV2.runJestHarness({
    //     opts: { notes },
    //     results: NOTE_INIT_PRESET.domainStub.results,
    //     expect,
    //   });
    // });
  });
});
