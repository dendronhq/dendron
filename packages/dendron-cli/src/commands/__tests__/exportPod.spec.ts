import { ExportPodCLICommand } from "../exportPod";
import {
  FileTestUtils,
  EngineTestUtils,
  writeYAML,
  NodeTestUtils,
} from "@dendronhq/common-server";
import {
  JSONExportPod,
  getPodConfigPath,
  getPodPath,
} from "@dendronhq/pods-core";
import fs, { ensureDirSync } from "fs-extra";
import path from "path";

describe("exportPod", () => {
  let vault: string;
  let podsDir: string;

  beforeEach(function () {
    vault = EngineTestUtils.setupStoreDir({
      copyFixtures: false,
      initDirCb: (root) => {
        NodeTestUtils.createNotes(root, [
          { fname: "foo", stub: true },
          { fname: "bar" },
        ]);
      },
    });
    podsDir = FileTestUtils.tmpDir().name;
  });

  test("json export, no config", async () => {
    try {
      await ExportPodCLICommand.run({
        podId: JSONExportPod.id,
        podsDir,
        vault,
      });
    } catch (err) {
      expect(err.message === "no config");
    }
  });

  test("config present, default", async () => {
    const configPath = getPodConfigPath(podsDir, JSONExportPod);
    const exportDest = path.join(
      getPodPath(podsDir, JSONExportPod),
      "export.json"
    );
    ensureDirSync(path.dirname(configPath));
    writeYAML(configPath, { dest: exportDest });
    await ExportPodCLICommand.run({
      podId: JSONExportPod.id,
      podsDir,
      vault,
    });
    const payload = fs.readJSONSync(exportDest);
    expect(
      NodeTestUtils.cleanNodeMeta({ payload, fields: ["fname", "body"] })
    ).toEqual([
      { fname: "root", body: "\n" },
      { fname: "bar", body: "bar body\n" },
    ]);
  });
});
