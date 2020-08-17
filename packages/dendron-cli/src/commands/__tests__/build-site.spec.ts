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
import _ from "lodash";

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
    fs.removeSync(root);
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
    expect(data.id).toEqual("foo");
    expect(content).toMatchSnapshot("bond");
    expect(content.indexOf("- [lbl](refactor.one)") >= 0).toBe(true);
    expect(content.indexOf("SECRETS") < 0).toBe(true);
  });

  test("multiple roots", async () => {
    const siteRoot = FileTestUtils.tmpDir();
    await engine.init();
    const config = {
      noteRoot: "root",
      noteRoots: ["foo", "build-site"],
      siteRoot: siteRoot.name,
    };
    const dendronRoot = root;
    await new BuildSiteCommand().execute({ engine, config, dendronRoot });
    const buildDir = path.join(siteRoot.name, "notes");
    const dir = fs.readdirSync(buildDir);
    expect(_.includes(dir, "foo.md")).toBeTruthy();
    expect(_.includes(dir, "build-site.md")).toBeTruthy();
    expect(_.includes(dir, "refactor.one.md")).toBeFalsy();
    let { data } = readMD(path.join(buildDir, "foo.md"));
    expect(data.nav_order).toEqual(0);
    expect(data.parent).toBe(null);
    ({ data } = readMD(path.join(buildDir, "build-site.md")));
    expect(data.nav_order).toEqual(1);
    expect(data.parent).toBe(null);
  });
});
