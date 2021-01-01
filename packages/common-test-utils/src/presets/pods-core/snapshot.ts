import fs from "fs-extra";
import path from "path";
import { filterDotFiles, NodeTestPresetsV2 } from "../..";
import { TestPresetEntry } from "../../utils";

const EXPORT_DEFAULTS = new TestPresetEntry({
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
    const snapshotVault = filterDotFiles(fs.readdirSync(vaultPath));
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

const IMPORT_BASIC = new TestPresetEntry({
  label: "with defaults",
  before: async ({ vaultDir }: { vaultDir: string }) => {
    await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
      vaultDir,
    });
  },
  results: async ({ vaultDirPath }: { vaultDirPath: string }) => {
    const vaultDir = fs.readdirSync(vaultDirPath);

    expect(vaultDir.length).toEqual(7);
    // copy assets
    const assetsDir = fs.readdirSync(path.join(vaultDirPath, "assets"));
    expect(assetsDir).toEqual(["foo.jpg"]);

    const scenarios = [
      {
        actual: vaultDir.length,
        expected: 7,
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
  EXPORT: {
    DEFAULTS: EXPORT_DEFAULTS,
  },
  IMPORT: {
    BASIC: IMPORT_BASIC,
  },
};

export default SNAPSHOT_TEST_PRESETS;
