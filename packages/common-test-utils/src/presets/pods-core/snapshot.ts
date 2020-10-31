import fs from "fs-extra";
import path from "path";
import { NodeTestPresetsV2 } from "../..";
import { TestPresetEntry } from "../../utils";

const DEFAULTS = new TestPresetEntry({
  label: "with defaults",
  before: async ({ vaultDir }: { vaultDir: string }) => {
    await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
      vaultDir,
    });
  },
  results: async ({
    wsRoot,
    snapshotDirPath,
  }: {
    wsRoot: string;
    snapshotDirPath: string;
  }) => {
    let defaultSnapshotRootPath = path.join(wsRoot, "snapshots");
    const vaultPath = path.join(snapshotDirPath, "vault");
    const snapshotVault = fs.readdirSync(vaultPath);
    const assetsDir = fs.readdirSync(path.join(vaultPath, "assets"));

    const scenarios = [
      {
        actual: path.dirname(snapshotDirPath),
        expected: defaultSnapshotRootPath,
      },
      {
        actual: snapshotVault.length,
        expected: 6,
      },
      {
        actual: assetsDir,
        expected: ["foo.jpg"],
      },
    ];
    return scenarios;
  },
});

const SNAPSHOT_TEST_PRESETS = {
  DEFAULTS,
};

export default SNAPSHOT_TEST_PRESETS;
