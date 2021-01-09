import { DPod, DVault } from "@dendronhq/common-all";
import { writeYAML } from "@dendronhq/common-server";
import {
  createMockEngine,
  PODS_CORE,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import { JSONExportPod, PodUtils } from "@dendronhq/pods-core";
import { ensureDirSync } from "fs-extra";
import path from "path";
import { ExportPodCLICommand } from "../exportPod";

describe("exportPod", () => {
  let vault: DVault;
  let podsDir: string;
  let wsRoot: string;

  test("json export, no config", async () => {
    try {
      await ExportPodCLICommand.run({
        podId: JSONExportPod.id,
        wsRoot,
        vault,
      });
    } catch (err) {
      expect(err.message === "no config");
    }
  });

  test.skip("config present, default", async () => {
    const preset = PODS_CORE.JSON.EXPORT.BASIC;
    const fakePod = (): DPod<any> => {
      return {
        config: [],
        execute: async ({ wsRoot, config, vaults }) => {
          const podClass = JSONExportPod;
          const configPath = PodUtils.getConfigPath({ podsDir, podClass });
          ensureDirSync(path.dirname(configPath));
          writeYAML(configPath, config);

          await ExportPodCLICommand.run({
            podId: JSONExportPod.id,
            wsRoot,
            vault: vaults[0],
          });
        },
      };
    };
    // @ts-ignore
    const { opts, resp } = await runEngineTestV4(preset.testFunc, {
      ...preset,
      createEngine: createMockEngine,
      expect,
      setupOnly: true,
      extra: { pod: fakePod() },
    });
    preset.genTestResults!({ ...opts, extra: resp });
  });
});
