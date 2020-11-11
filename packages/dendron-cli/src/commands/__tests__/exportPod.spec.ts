import { writeYAML } from "@dendronhq/common-server";
import {
  EngineTestUtilsV2,
  NodeTestPresetsV2,
  PODS_CORE,
} from "@dendronhq/common-test-utils";
import { JSONExportPod, PodUtils } from "@dendronhq/pods-core";
import { ensureDirSync } from "fs-extra";
import path from "path";
import { ExportPodCLICommand } from "../exportPod";

describe("exportPod", () => {
  let vault: string;
  let podsDir: string;
  let wsRoot: string;
  let vaults: string[];

  beforeEach(async () => {
    ({ vaults, wsRoot } = await EngineTestUtilsV2.setupWS({
      initDirCb: async (vaultDir) => {
        await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
          vaultDir,
        });
      },
    }));
    podsDir = path.join(wsRoot, "pods");
  });

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

  test("config present, default", async () => {
    const podClass = JSONExportPod;
    const configPath = PodUtils.getConfigPath({ podsDir, podClass });
    const exportDest = path.join(
      PodUtils.getPath({ podsDir, podClass }),
      "export.json"
    );
    ensureDirSync(path.dirname(configPath));
    writeYAML(configPath, { dest: exportDest });
    await ExportPodCLICommand.run({
      podId: JSONExportPod.id,
      wsRoot,
      vault: vaults[0],
    });
    await NodeTestPresetsV2.runJestHarness({
      opts: {
        destPath: exportDest,
        vault: { fsPath: vaults[0] },
      },
      results: PODS_CORE.JSON.EXPORT.BASIC.results,
      expect,
    });
  });
});
