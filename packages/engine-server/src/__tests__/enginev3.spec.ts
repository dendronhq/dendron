import { DEngineV2, DVault } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import {
  EngineTestUtilsV3,
  NodeTestPresetsV2,
} from "@dendronhq/common-test-utils";
import { FileStorageV2 } from "../drivers/file/storev2";
import { DendronEngineV2 } from "../enginev2";

let LOGGER = createLogger("enginev2.spec", "/tmp/engine-server.log");

const setupCase1 = async () => {
  const vaults = await EngineTestUtilsV3.setupVaults({
    initDirCb: async (vaultPath: string) => {
      await NodeTestPresetsV2.createOneNoteOneSchemaPreset({
        vaultDir: vaultPath,
      });
    },
  });
  const engine = new DendronEngineV2({
    vaultsv3: vaults,
    vaults: [],
    forceNew: true,
    store: new FileStorageV2({ vaultsv3: vaults, vaults: [], logger: LOGGER }),
    mode: "fuzzy",
    logger: LOGGER,
  });
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
      expect(engine.notes).toMatchSnapshot();
      expect(engine.schemas).toMatchSnapshot();
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
