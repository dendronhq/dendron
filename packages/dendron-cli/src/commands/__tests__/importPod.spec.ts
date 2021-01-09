import { DVault } from "@dendronhq/common-all";
import { tmpDir, vault2Path, writeYAML } from "@dendronhq/common-server";
import { FileTestUtils, NodeTestUtilsV2 } from "@dendronhq/common-test-utils";
import { MarkdownImportPod, PodUtils } from "@dendronhq/pods-core";
import fs, { ensureDirSync } from "fs-extra";
import path from "path";
import { ImportPodCLICommand } from "../importPod";

const { createFiles } = FileTestUtils;

describe("markdown pod", async () => {
  let importSrc: string;
  let wsRoot: string;
  let vault: DVault;

  beforeEach(async function () {
    importSrc = tmpDir().name;
    wsRoot = tmpDir().name;
    vault = { fsPath: tmpDir().name };
    await NodeTestUtilsV2.createNotes({ vaultPath: vault.fsPath });

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

    const vpath = vault2Path({ wsRoot, vault });
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(vpath, [
      "assets",
      "project.p1.md",
      "project.p1.n1.md",
      "project.p1.n2.md",
      "project.p2.n1.md",
      "project.p-3.n1.md",
      "root.md",
    ]);
    expect(expectedFiles).toEqual(actualFiles);
    const assetsDir = fs.readdirSync(path.join(vault.fsPath, "assets"));
    expect(assetsDir.length).toEqual(2);
    const fileBody = fs.readFileSync(path.join(vault.fsPath, "project.p1.md"), {
      encoding: "utf8",
    });
    expect(fileBody.match("n1.pdf")).toBeTruthy();
    expect(fileBody.match("n3.pdf")).toBeTruthy();
  });
});
