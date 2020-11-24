import { DVault } from "@dendronhq/common-all/";
import _ from "lodash";
import { tmpDir } from "@dendronhq/common-server";
import {
  AssertUtils,
  EngineTestUtilsV3,
  FileTestUtils,
  NotePresetsUtils,
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
  let createFiles: () => Promise<any>;
  let checkFiles: (opts: { vault: string }) => any;

  beforeEach(async () => {
    ({ wsRoot, vaults } = await EngineTestUtilsV3.setupWS({
      initVault1: async (vaultDir: string) => {
        await NotePresetsUtils.createBasic({ vaultDir, fname: "foo" });
      },
      initVault2: async (vaultDir: string) => {
        await NotePresetsUtils.createBasic({ vaultDir, fname: "bar" });
      },
    }));
    engine = DendronEngineV2.createV3({ vaults, wsRoot });
    importSrc = tmpDir().name;
    // setup
    createFiles = async () => {
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
    };
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
    // check
    checkFiles = ({ vault }: { vault: string }) => {
      let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(vault, [
        "assets",
        "project.p1.md",
        "project.p1.n1.md",
        "project.p1.n2.md",
        "project.p2.n1.md",
        "project.p-3.n1.md",
        "foo.ch1.md",
        "foo.md",
        "foo.schema.yml",
        "root.schema.yml",
        "root.md",
      ]);
      expect(expectedFiles).toEqual(actualFiles);

      return;
    };
  });

  test("root with mult folders", async () => {
    await createFiles();
    await engine.init();
    fs.ensureDirSync(path.join(importSrc, "project2"));
    // await executePod({importSrc: path.join(importSrc, "project")});
    await executePod({ importSrc });
    const vault = vaults[0].fsPath;
    checkFiles({ vault });
    const body = fs.readFileSync(path.join(vault, "project.p1.md"), {
      encoding: "utf8",
    });
    const out = await AssertUtils.assertInString({
      body,
      match: ["n1.pdf", "n3.pdf"],
      nomatch: [],
    });
    expect(out).toBeTruthy();
    const assets = fs.readdirSync(path.join(vault, "assets"));
    expect(assets.length).toEqual(3);
  });

  test("root with asset", async () => {
    await createFiles();
    await engine.init();
    fs.ensureDirSync(path.join(importSrc, "project2"));
    // await executePod({importSrc: path.join(importSrc, "project")});
    await executePod({ importSrc });
    const vault = vaults[0].fsPath;
    checkFiles({ vault });
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

  test("basic", async () => {
    await createFiles();
    await engine.init();
    await executePod();
    const vault = vaults[0].fsPath;
    checkFiles({ vault });

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
      "foo.ch1.md",
      "foo.md",
      "foo.schema.yml",
      "root.schema.yml",
      "root.md",
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
      "foo.ch1.md",
      "foo.md",
      "foo.schema.yml",
      "root.schema.yml",
      "root.md",
    ]);
    expect(expectedFiles).toEqual(actualFiles);
  });

  test("convert links", async () => {
    await createFiles();
    fs.writeFileSync(
      path.join(importSrc, "project/p2/n1.md"),
      "[[project/p1/n1]]"
    );
    await engine.init();
    await executePod();
    const vault = vaults[0].fsPath;
    checkFiles({ vault });
    const body = fs.readFileSync(path.join(vault, "project.p2.n1.md"), {
      encoding: "utf8",
    });
    const out = await AssertUtils.assertInString({
      body,
      match: ["[[project.p1.n1]]"],
      nomatch: [],
    });
    expect(out).toBeTruthy();
  });
});
