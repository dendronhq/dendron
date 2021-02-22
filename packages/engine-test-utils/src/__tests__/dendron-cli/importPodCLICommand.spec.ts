import { tmpDir, vault2Path, writeYAML } from "@dendronhq/common-server";
import { FileTestUtils } from "@dendronhq/common-test-utils";
import { ImportPodCLICommand, PodSource } from "@dendronhq/dendron-cli";
import { MarkdownImportPod, PodUtils } from "@dendronhq/pods-core";
import { ensureDirSync } from "fs-extra";
import path from "path";
import { runEngineTestV5 } from "../../engine";
import fs from "fs-extra";

const { createFiles } = FileTestUtils;
describe("ImportPodCLICommand", () => {
  // TODO: race condition
  test.skip("basic", async () => {
    let importSrc: string;
    importSrc = tmpDir().name;
    await runEngineTestV5(
      async ({ wsRoot, vaults }) => {
        const podsDir = path.join(wsRoot, "pods");
        const podClass = MarkdownImportPod;
        const configPath = PodUtils.getConfigPath({ podsDir, podClass });
        const vault = vaults[0];
        ensureDirSync(path.dirname(configPath));
        writeYAML(configPath, { src: importSrc });

        const podSource = PodSource.BUILTIN;
        await new ImportPodCLICommand().eval({
          podId: MarkdownImportPod.id,
          wsRoot,
          vault,
          podSource,
        });

        const vpath = vault2Path({ wsRoot, vault });
        let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(vpath, [
          "assets",
          "project.p1.md",
          "project.p1.n1.md",
          "project.p1.n2.md",
          "project.p2.n1.md",
          "project.p-3.n1.md",
          "root.md",
          "root.schema.yml",
        ]);
        expect(expectedFiles).toEqual(actualFiles);
        const assetsDir = fs.readdirSync(path.join(vpath, "assets"));
        expect(assetsDir.length).toEqual(2);
        const fileBody = fs.readFileSync(path.join(vpath, "project.p1.md"), {
          encoding: "utf8",
        });
        expect(fileBody.match("n1.pdf")).toBeTruthy();
        expect(fileBody.match("n3.pdf")).toBeTruthy();
      },
      {
        expect,
        preSetupHook: async () => {
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
        },
      }
    );
  });
});
