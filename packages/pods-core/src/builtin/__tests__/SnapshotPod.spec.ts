import { DEngineClientV2 } from "@dendronhq/common-all/src";
import { createLogger } from "@dendronhq/common-server/src";
import {
  EngineTestUtilsV2,
  NodeTestPresetsV2,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2, FileStorageV2 } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import { SnapshotExportPod } from "../SnapshotPod";

describe("SnapshotPod", () => {
  let vaults: string[];
  let wsRoot: string;
  let engine: DEngineClientV2;

  beforeEach(async () => {
    ({ wsRoot, vaults } = await EngineTestUtilsV2.setupWS({
      initDirCb: async (vaultDir) => {
        await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
          vaultDir,
        });
      },
    }));
    const LOGGER = createLogger();
    engine = new DendronEngineV2({
      vaults,
      forceNew: true,
      store: new FileStorageV2({ vaults, logger: LOGGER }),
      mode: "fuzzy",
      logger: LOGGER,
    });
  });

  test("basic", async () => {
    let dest = path.join(wsRoot, "snapshot");
    const pod = new SnapshotExportPod({ vaults, wsRoot, engine });
    fs.ensureDirSync(dest);
    const { snapshotDirPath } = await pod.plant({
      config: {
        dest,
      },
      mode: "notes",
    });
    const snapshotDir = fs.readdirSync(snapshotDirPath);

    expect(snapshotDir).toMatchSnapshot();
    // backup vault
    const vaultPath = path.join(snapshotDirPath, "vault");
    const snapshotVault = fs.readdirSync(vaultPath);
    expect(snapshotVault).toMatchSnapshot();
    expect(snapshotVault.length).toEqual(6);
    // copy assets
    const assetsDir = fs.readdirSync(path.join(vaultPath, "assets"));
    expect(assetsDir).toEqual(["foo.jpg"]);
  });

  test("empty ignore", async () => {
    let dest = path.join(wsRoot, "snapshot");
    const pod = new SnapshotExportPod({ vaults, wsRoot, engine });
    fs.ensureDirSync(dest);
    const { snapshotDirPath } = await pod.plant({
      config: {
        dest,
        ignore: "",
      },
      mode: "notes",
    });
    const snapshotDir = fs.readdirSync(snapshotDirPath);

    expect(snapshotDir).toMatchSnapshot();
    // backup vault
    const vaultPath = path.join(snapshotDirPath, "vault");
    const snapshotVault = fs.readdirSync(vaultPath);
    expect(snapshotVault).toMatchSnapshot();
    expect(snapshotVault.length).toEqual(7);
    // copy assets
    const assetsDir = fs.readdirSync(path.join(vaultPath, "assets"));
    expect(assetsDir).toEqual(["foo.jpg"]);
  });

  test("ignore foo", async () => {
    let dest = path.join(wsRoot, "snapshot");
    const pod = new SnapshotExportPod({ vaults, wsRoot, engine });
    fs.ensureDirSync(dest);
    const { snapshotDirPath } = await pod.plant({
      config: {
        dest,
        ignore: "foo*",
      },
      mode: "notes",
    });
    const snapshotDir = fs.readdirSync(snapshotDirPath);

    expect(snapshotDir).toMatchSnapshot();
    // backup vault
    const vaultPath = path.join(snapshotDirPath, "vault");
    const snapshotVault = fs.readdirSync(vaultPath);
    expect(snapshotVault).toMatchSnapshot();
    expect(snapshotVault.length).toEqual(4);
    // copy assets
    const assetsDir = fs.readdirSync(path.join(vaultPath, "assets"));
    expect(assetsDir).toEqual(["foo.jpg"]);
  });
});
