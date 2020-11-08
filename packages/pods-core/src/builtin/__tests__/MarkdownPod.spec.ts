import { DVault } from "@dendronhq/common-all/";
import _ from "lodash";
import { tmpDir } from "@dendronhq/common-server";
import {
  AssertUtils,
  EngineTestUtilsV3,
  FileTestUtils,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import { MarkdownImportPod } from "../MarkdownPod";

type ExecutePodOpts = {
  importSrc?: string;
};

describe("MarkdownPod", () => {
  let wsRoot: string;
  let vaults: DVault[];
  let importSrc: string;
  // let wsRoot: string;
  let engine: DendronEngineV2;
  let executePod: (opts?: ExecutePodOpts) => Promise<any>;

  beforeEach(async () => {
    ({ wsRoot, vaults } = await EngineTestUtilsV3.setupWS({}));
    engine = DendronEngineV2.createV3({ vaults });
    executePod = async (opts?: { importSrc?: string }) => {
      const cleanOpts = _.defaults(opts, { importSrc: importSrc });
      const pod = new MarkdownImportPod();
      await pod.execute({
        config: {
          src: cleanOpts.importSrc,
          concatenate: false,
        },
        engine,
        vaults,
        wsRoot,
      });
    };
  });

  test("basic", async () => {
    importSrc = tmpDir().name;
    await FileTestUtils.createFiles(importSrc, [
      { path: "project/p2/n1.md" },
      { path: "project/p1/n1.md" },
      { path: "project/p1/n2.md" },
      { path: "project/p1/.DS_STORE_TEST" },
      { path: "project/p1/n3.pdf" },
      { path: "project/p1/n1.pdf" },
      { path: "project/p1/n1.pdf" },
      { path: "project/p.3/n1.md" },
    ]);
    await engine.init();
    await executePod();
    const vault = vaults[0].fsPath;
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(vault, [
      "assets",
      "project.p1.md",
      "project.p1.n1.md",
      "project.p1.n2.md",
      "project.p2.n1.md",
      "project.p-3.n1.md",
    ]);
    expect(expectedFiles).toEqual(actualFiles);
    const body = fs.readFileSync(path.join(vault, "project.p1.md"), {
      encoding: "utf8",
    });
    const out = await AssertUtils.assertInString({
      body,
      match: ["n1.pdf", "n3.pdf"],
      nomatch: [],
    });
    expect(out).toBeTruthy();
  });

  test("basic 2", async () => {
    importSrc = tmpDir().name;
    await FileTestUtils.createFiles(importSrc, [
      { path: "project/p2/n1.md" },
      { path: "project/p1/n1.md" },
      { path: "project/p1/n2.md" },
      { path: "project/p1/.DS_STORE_TEST" },
      { path: "project/p1/n3.pdf" },
      { path: "project/p1/n1.pdf" },
      { path: "project/p1/n1.pdf" },
      { path: "project/p.3/n1.md" },
    ]);
    await engine.init();
    await executePod({ importSrc: importSrc + "/" });
    const vault = vaults[0].fsPath;
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(vault, [
      "assets",
      "project.p1.md",
      "project.p1.n1.md",
      "project.p1.n2.md",
      "project.p2.n1.md",
      "project.p-3.n1.md",
    ]);
    expect(expectedFiles).toEqual(actualFiles);
    const body = fs.readFileSync(path.join(vault, "project.p1.md"), {
      encoding: "utf8",
    });
    const out = await AssertUtils.assertInString({
      body,
      match: ["n1.pdf", "n3.pdf"],
      nomatch: [],
    });
    expect(out).toBeTruthy();
  });

  test("special chars", async () => {
    importSrc = tmpDir().name;
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
    await engine.init();
    await executePod();
    const vault = vaults[0].fsPath;
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(vault, [
      "assets",
      "project.p1.md",
      "project.p1.n~1.md",
      "project.p-1.n2.md",
      "project.p2.n-1.md",
      "project.p-3.n1.md",
    ]);
    expect(expectedFiles).toEqual(actualFiles);
  });

  test.skip("convert links", () => {});
});
