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
  let siteRoot: string;
  let dendronRoot: string;
  let buildDir: string;

  beforeEach(async () => {
    root = setupTmpDendronDir();
    engine = DendronEngine.getOrCreateEngine({
      root,
      forceNew: true,
      mode: "exact",
    });
    siteRoot = FileTestUtils.tmpDir().name;
    dendronRoot = root;
    buildDir = path.join(siteRoot, "notes");
    await engine.init();
  });

  afterEach(() => {
    fs.removeSync(root);
  });

  test("basic", async () => {
    const config = {
      noteRoot: "root",
      siteRoot,
    };
    await new BuildSiteCommand().execute({ engine, config, dendronRoot });
    const { data, content } = readMD(path.join(buildDir, "foo.md"));
    expect(data.id).toEqual("foo");
    expect(content).toMatchSnapshot("bond");
    expect(content.indexOf("- [lbl](refactor.one)") >= 0).toBe(true);
    expect(content.indexOf("SECRETS") < 0).toBe(true);
  });

  test("multiple roots", async () => {
    const config = {
      noteRoot: "root",
      noteRoots: ["foo", "build-site"],
      siteRoot,
    };
    await new BuildSiteCommand().execute({ engine, config, dendronRoot });
    const dir = fs.readdirSync(buildDir);
    expect(_.includes(dir, "foo.md")).toBeTruthy();
    expect(_.includes(dir, "build-site.md")).toBeTruthy();
    expect(_.includes(dir, "refactor.one.md")).toBeFalsy();
    let { data, content } = readMD(path.join(buildDir, "foo.md"));
    expect(data.nav_order).toEqual(0);
    expect(data.parent).toBe(null);
    expect(content).toMatchSnapshot("foo.md");
    ({ data, content } = readMD(path.join(buildDir, "build-site.md")));
    expect(data.nav_order).toEqual(1);
    expect(data.parent).toBe(null);
    expect(content).toMatchSnapshot("build-site.md");
  });

  test("image prefix", async () => {
    const config = {
      noteRoot: "root",
      noteRoots: ["sample"],
      siteRoot,
      assetsPrefix: "fake-s3.com/",
    };
    await new BuildSiteCommand().execute({ engine, config, dendronRoot });

    const { content } = readMD(path.join(buildDir, "sample.image-link.md"));
    const dir = fs.readdirSync(siteRoot);

    expect(content).toMatchSnapshot("sample.image-link.md");

    expect(_.includes(dir, "assets")).toBeFalsy();
    expect(_.trim(content)).toEqual("![link-alt](fake-s3.com/link-path.jpg)");
  });
});
