import { DEngineClientV2 } from "@dendronhq/common-all/src";
import { createLogger } from "@dendronhq/common-server/src";
import {
  EngineTestUtilsV2,
  NodeTestPresetsV2,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2, FileStorageV2 } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import { SnapshotExportPod, SnapshotImportPod } from "../SnapshotPod";

describe("SnapshotPodExport", () => {
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

  test("config", async () => {
    const config = new SnapshotExportPod().config;
    expect(config).toMatchSnapshot();
  });

  test("basic", async () => {
    let dest = path.join(wsRoot, "snapshot");
    const pod = new SnapshotExportPod();
    // { vaults, wsRoot, engine });
    fs.ensureDirSync(dest);
    const { snapshotDirPath } = await pod.execute({
      config: {
        dest,
      },
      engine,
      vaults: vaults.map((ent) => ({ fsPath: ent })),
      wsRoot,
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
    const pod = new SnapshotExportPod();
    fs.ensureDirSync(dest);
    const { snapshotDirPath } = await pod.execute({
      config: {
        dest,
        ignore: "",
      },
      engine,
      vaults: vaults.map((ent) => ({ fsPath: ent })),
      wsRoot,
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
    const pod = new SnapshotExportPod();
    fs.ensureDirSync(dest);
    const { snapshotDirPath } = await pod.execute({
      config: {
        dest,
        ignore: "foo*",
      },
      engine,
      vaults: vaults.map((ent) => ({ fsPath: ent })),
      wsRoot,
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

describe.skip("SnapshotPodImport", () => {
  let vaults: string[];
  let wsRoot: string;
  let engine: DEngineClientV2;
  let snapshotDirPath: string;

  beforeEach(async () => {
    ({ wsRoot, vaults } = await EngineTestUtilsV2.setupWS({}));
    const LOGGER = createLogger();
    engine = new DendronEngineV2({
      vaults,
      forceNew: true,
      store: new FileStorageV2({ vaults, logger: LOGGER }),
      mode: "fuzzy",
      logger: LOGGER,
    });
    let dest = path.join(wsRoot, "snapshot");
    fs.ensureDirSync(dest);

    const createSnapshot = async () => {
      // setp for export
      const { wsRoot, vaults } = await EngineTestUtilsV2.setupWS({
        initDirCb: async (vaultDir) => {
          await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
            vaultDir,
          });
        },
      });
      const pod = new SnapshotExportPod({ vaults, wsRoot, engine });
      const resp = await pod.plant({
        config: {
          dest,
        },
        mode: "notes",
      });
      return resp;
    };

    snapshotDirPath = (await createSnapshot()).snapshotDirPath;
  });

  test("basic", async () => {
    const pod = new SnapshotImportPod({ vaults, wsRoot, engine });
    await pod.plant({
      config: {
        src: snapshotDirPath,
      },
      mode: "schemas",
    });
    const vaultDir = fs.readdirSync(vaults[0]);
    expect(vaultDir).toMatchSnapshot();
    // +1 for git
    expect(vaultDir.length).toEqual(7);
    // copy assets
    const assetsDir = fs.readdirSync(path.join(vaults[0], "assets"));
    expect(assetsDir).toEqual(["foo.jpg"]);
  });

  test("don't write git", async () => {
    fs.rmdirSync(path.join(vaults[0], ".git"));
    fs.ensureDirSync(path.join(snapshotDirPath, "vaults", ".git"));
    const pod = new SnapshotImportPod({ vaults, wsRoot, engine });
    await pod.plant({
      config: {
        src: snapshotDirPath,
      },
      mode: "schemas",
    });
    const vaultDir = fs.readdirSync(vaults[0]);
    expect(vaultDir).toMatchSnapshot();
    // no git
    expect(vaultDir.length).toEqual(6);
    // copy assets
    const assetsDir = fs.readdirSync(path.join(vaults[0], "assets"));
    expect(assetsDir).toEqual(["foo.jpg"]);
  });
});
