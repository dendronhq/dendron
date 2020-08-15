import { DEngine } from "@dendronhq/common-all";
import fs from "fs-extra";
import {
  LernaTestUtils,
  EngineTestUtils,
  FileTestUtils,
  readMD,
} from "@dendronhq/common-server";
import { DendronEngine } from "@dendronhq/engine-server";
import { BuildSiteCommand } from "../build-site";
import path from "path";

function setupTmpDendronDir() {
  return EngineTestUtils.setupStoreDir(
    LernaTestUtils.getFixturesDir("store"),
    FileTestUtils.tmpDir().name
  );
}

describe("build-site", () => {
  let root: string;
  let engine: DEngine;

  beforeEach(() => {
    root = setupTmpDendronDir();
    engine = DendronEngine.getOrCreateEngine({
      root,
      forceNew: true,
      mode: "exact",
    });
  });

  afterEach(() => {
    // expect(actualFiles).toEqual(expectedFiles);
    console.log("bond");
    console.log(root);
    // fs.removeSync(root);
  });
  test("basic", async () => {
    const siteRoot = FileTestUtils.tmpDir();
    await engine.init();
    const config = {
      noteRoot: "root",
      siteRoot: siteRoot.name,
    };
    const dendronRoot = root;
    await new BuildSiteCommand().execute({ engine, config, dendronRoot });
    const buildDir = path.join(siteRoot.name, "notes");
    const { data, content } = readMD(path.join(buildDir, "foo.md"));
    expect(content).toMatchSnapshot("bond-foo");
    expect(data.id).toEqual("foo");
    expect(content.indexOf("- [refactor-one](refactor.one)") >= 0).toBe(true);
    expect(1).toEqual(1);
  });
});
