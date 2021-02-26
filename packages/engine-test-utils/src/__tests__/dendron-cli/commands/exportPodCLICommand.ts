import { runEngineTestV5 } from "../../../engine";

describe("ExportPodCLICommand", () => {
  test.skip("basic", async () => {
    // let importSrc: string;
    // importSrc = tmpDir().name;
    await runEngineTestV5(async ({}) => {}, {
      expect,
      preSetupHook: async () => {},
    });
  });
});
