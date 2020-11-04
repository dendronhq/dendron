import { DEngineClientV2 } from "@dendronhq/common-all";
import {
  createLogger,
  FileTestUtils,
  writeYAML,
} from "@dendronhq/common-server";
import {
  NodeTestPresetsV2,
  NodeTestUtilsV2,
  PODS_CORE,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2, FileStorageV2 } from "@dendronhq/engine-server";
import {
  JSONImportPod,
  JSONImportPodRawConfig,
  MarkdownImportPod,
  PodUtils,
} from "@dendronhq/pods-core";
import fs, { ensureDirSync } from "fs-extra";
import path from "path";
import { ImportPodCLICommand } from "../importPod";

const { createFiles } = FileTestUtils;

describe("json pod", () => {
  let engine: DEngineClientV2;

  test("json export, no config", async () => {
    const {
      wsRoot,
      vaults,
      importSrc,
    } = await PODS_CORE.JSON.IMPORT.BASIC.before({});
    const LOGGER = createLogger();
    engine = new DendronEngineV2({
      vaults,
      forceNew: true,
      store: new FileStorageV2({
        vaults,
        logger: LOGGER,
      }),
      mode: "fuzzy",
      logger: LOGGER,
    });
    await engine.init();
    const pod = new JSONImportPod();
    const config: JSONImportPodRawConfig = {
      src: importSrc,
      concatenate: false,
    };
    await pod.execute({
      config,
      vaults: vaults.map((fsPath: string) => ({ fsPath })),
      wsRoot,
      engine,
    });
    await NodeTestPresetsV2.runJestHarness({
      opts: {
        vaultPath: vaults[0],
      },
      results: PODS_CORE.JSON.IMPORT.BASIC.results,
      expect,
    });
  });
});

describe("markdown pod", async () => {
  let importSrc: string;
  let wsRoot: string;
  let vault: string;

  beforeEach(async function () {
    importSrc = FileTestUtils.tmpDir().name;
    wsRoot = FileTestUtils.tmpDir().name;
    vault = FileTestUtils.tmpDir().name;
    await NodeTestUtilsV2.createNotes({ vaultPath: vault });

    await createFiles(importSrc, [
      { path: "project/p2/n1.md" },
      { path: "project/p1/n1.md" },
      { path: "project/p1/n2.md" },
      { path: "project/p1/.DS_STORE_TEST" },
      { path: "project/p1/n3.pdf" },
      { path: "project/p1/n1.pdf" },
      { path: "project/p1/n1.pdf" },
      { path: "project/p.3/n1.md" },
    ]);
  });

  test("file import, no config", async () => {
    try {
      await ImportPodCLICommand.run({
        podId: MarkdownImportPod.id,
        wsRoot,
        vault,
      });
    } catch (err) {
      expect(err.message === "no config");
    }
  });

  test("config present, default", async () => {
    const podsDir = path.join(wsRoot, "pods");
    const podClass = MarkdownImportPod;
    const configPath = PodUtils.getConfigPath({ podsDir, podClass });
    ensureDirSync(path.dirname(configPath));
    writeYAML(configPath, { src: importSrc });

    const cmd = await ImportPodCLICommand.run({
      podId: MarkdownImportPod.id,
      wsRoot,
      vault,
    });
    cmd.L.info({ msg: "in test file" });

    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(vault, [
      "assets",
      "project.p1.md",
      "project.p1.n1.md",
      "project.p1.n2.md",
      "project.p2.n1.md",
      "project.p-3.n1.md",
      "root.md",
    ]);
    expect(expectedFiles).toEqual(actualFiles);
    const assetsDir = fs.readdirSync(path.join(vault, "assets"));
    expect(assetsDir.length).toEqual(2);
    const fileBody = fs.readFileSync(path.join(vault, "project.p1.md"), {
      encoding: "utf8",
    });
    expect(fileBody.match("n1.pdf")).toBeTruthy();
    expect(fileBody.match("n3.pdf")).toBeTruthy();
  });
});
