import { DPod } from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import { FileTestUtils } from "../../fileUtils";
import { TestPresetEntryV4 } from "../../utilsv2";
import fs from "fs-extra";
import path from "path";
import { AssertUtils } from "../../utils";

const IMPORT = {
  ROOT_WITH_MULT_FOLDERS: new TestPresetEntryV4(
    async ({ wsRoot, engine, vaults, extra }) => {
      const { pod } = extra as { pod: DPod<any> };
      const importSrc = tmpDir().name;
      await FileTestUtils.createFiles(importSrc, [
        { path: "foo.jpg" },
        { path: "project/p2/n1.md" },
        { path: "project/p1/n1.md" },
        { path: "project/p1/n2.md" },
        { path: "project/p1/.DS_STORE_TEST" },
        { path: "project/p1/n3.pdf" },
        { path: "project/p1/n1.pdf" },
        { path: "project/p1/n1.pdf" },
        { path: "project/p.3/n1.md" },
      ]);
      await pod.execute({
        config: {
          src: importSrc,
          concatenate: false,
        },
        engine,
        vaults,
        wsRoot,
      });
      const vpath = vault2Path({ vault: vaults[0], wsRoot });
      let [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(vpath, [
        "assets",
        "project.p1.md",
        "project.p1.n1.md",
        "project.p1.n2.md",
        "project.p2.n1.md",
        "project.p-3.n1.md",
        "root.schema.yml",
        "root.md",
      ]);
      const body = fs.readFileSync(path.join(vpath, "project.p1.md"), {
        encoding: "utf8",
      });
      const out = await AssertUtils.assertInString({
        body,
        match: ["n1.pdf", "n3.pdf"],
        nomatch: [],
      });
      return [
        {
          expected: expectedFiles,
          actual: actualFiles,
        },
        { expected: out, actual: true },
        {
          expected: 3,
          actual: fs.readdirSync(path.join(vpath, "assets")).length,
        },
      ];
    }
  ),
  SPECIAL_CHARS: new TestPresetEntryV4(
    async ({ wsRoot, engine, vaults, extra }) => {
      const { pod } = extra as { pod: DPod<any> };
      const importSrc = tmpDir().name;
      await FileTestUtils.createFiles(importSrc, [
        // spaces
        { path: "project/p2/n 1.md" },
        // symbols
        { path: "project/p1/n~1.md" },
        { path: "project/p 1/n2.md" },
        { path: "project/p1/.DS_STORE_TEST" },
        { path: "project/p1/n3.pdf" },
        { path: "project/p1/n1.pdf" },
        { path: "project/p1/n1.pdf" },
        { path: "project/p.3/n1.md" },
      ]);
      await pod.execute({
        config: {
          src: importSrc,
          concatenate: false,
        },
        engine,
        vaults,
        wsRoot,
      });
      const vpath = vault2Path({ vault: vaults[0], wsRoot });
      let [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(vpath, [
        "assets",
        "project.p1.md",
        "project.p1.n~1.md",
        "project.p-1.n2.md",
        "project.p2.n-1.md",
        "project.p-3.n1.md",
        "root.schema.yml",
        "root.md",
      ]);
      return [
        {
          expected: expectedFiles,
          actual: actualFiles,
        },
      ];
    }
  ),
  CONVERT_LINKS: new TestPresetEntryV4(
    async ({ wsRoot, engine, vaults, extra }) => {
      const { pod } = extra as { pod: DPod<any> };
      const importSrc = tmpDir().name;
      const filePath = path.join(importSrc, "project/p2/n1.md");
      fs.ensureDirSync(path.dirname(filePath));
      fs.writeFileSync(filePath, "[[project/p1/n1]]");
      await pod.execute({
        config: {
          src: importSrc,
          concatenate: false,
        },
        engine,
        vaults,
        wsRoot,
      });
      const vpath = vault2Path({ vault: vaults[0], wsRoot });
      const body = fs.readFileSync(path.join(vpath, "project.p2.n1.md"), {
        encoding: "utf8",
      });
      return [
        {
          expected: true,
          actual: await AssertUtils.assertInString({
            body,
            match: ["[[project.p1.n1]]"],
            nomatch: [],
          }),
        },
      ];
    }
  ),
};
const EXPORT = {};

const MARKDOWN_TEST_PRESET = {
  EXPORT,
  IMPORT,
};
export default MARKDOWN_TEST_PRESET;
