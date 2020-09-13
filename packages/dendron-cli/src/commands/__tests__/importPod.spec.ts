import {
  FileTestUtils,
  NodeTestUtils,
  writeYAML,
} from "@dendronhq/common-server";
import {
  FileImportPod,
  getPodConfigPath,
  JSONImportPod,
} from "@dendronhq/pods-core";
import fs, { ensureDirSync } from "fs-extra";
import path from "path";
import { ImportPodCLICommand } from "../importPod";

const { createFiles } = FileTestUtils;

describe("import file pod", async () => {
  let importSrc: string;
  let podsDir: string;
  let vault: string;

  beforeEach(async function () {
    importSrc = FileTestUtils.tmpDir().name;
    podsDir = FileTestUtils.tmpDir().name;
    vault = FileTestUtils.tmpDir().name;
    await NodeTestUtils.createNotes(vault, []);

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
        podId: FileImportPod.id,
        podsDir,
        vault,
      });
    } catch (err) {
      expect(err.message === "no config");
    }
  });

  test("config present, default", async () => {
    const configPath = getPodConfigPath(podsDir, FileImportPod);
    ensureDirSync(path.dirname(configPath));
    writeYAML(configPath, { src: importSrc });

    const cmd = await ImportPodCLICommand.run({
      podId: FileImportPod.id,
      podsDir,
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
