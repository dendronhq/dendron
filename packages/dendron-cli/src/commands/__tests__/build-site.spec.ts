import { DEngine, DendronSiteConfig } from "@dendronhq/common-all";
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
  let notesDir: string;

  beforeEach(async () => {
    root = setupTmpDendronDir();
    engine = DendronEngine.getOrCreateEngine({
      root,
      forceNew: true,
      mode: "exact",
    });
    siteRoot = FileTestUtils.tmpDir().name;
    dendronRoot = root;
    notesDir = path.join(siteRoot, "notes");
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
    const { data, content } = readMD(path.join(notesDir, "foo.md"));
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
    const dir = fs.readdirSync(notesDir);
    expect(_.includes(dir, "foo.md")).toBeTruthy();
    expect(_.includes(dir, "build-site.md")).toBeTruthy();
    expect(_.includes(dir, "refactor.one.md")).toBeFalsy();
    let { data, content } = readMD(path.join(notesDir, "foo.md"));
    expect(data.nav_order).toEqual(0);
    expect(data.parent).toBe(null);
    expect(content).toMatchSnapshot("foo.md");
    ({ data, content } = readMD(path.join(notesDir, "build-site.md")));
    expect(data.nav_order).toEqual(1);
    expect(data.parent).toBe(null);
    expect(content).toMatchSnapshot("build-site.md");
    const siteRootDir = fs.readdirSync(siteRoot);
    expect(_.includes(siteRootDir, "assets")).toBeTruthy();
  });

  test("image prefix", async () => {
    const config = {
      noteRoot: "root",
      noteRoots: ["sample"],
      siteRoot,
      assetsPrefix: "fake-s3.com/",
    };
    await new BuildSiteCommand().execute({ engine, config, dendronRoot });

    const { content } = readMD(path.join(notesDir, "sample.image-link.md"));
    const dir = fs.readdirSync(siteRoot);

    expect(content).toMatchSnapshot("sample.image-link.md");

    expect(_.includes(dir, "assets")).toBeFalsy();
    expect(_.trim(content)).toEqual("![link-alt](fake-s3.com/link-path.jpg)");
  });

  test("delete unused asset", async () => {
    const config = {
      noteRoot: "root",
      noteRoots: ["sample"],
      siteRoot,
    };
    await new BuildSiteCommand().execute({ engine, config, dendronRoot });
    const img = path.join(siteRoot, "assets", "images", "foo.jpg");
    expect(fs.existsSync(img)).toBeTruthy();

    // delete image, should be gone
    const imgSrc = path.join(root, "assets", "images", "foo.jpg");
    fs.unlinkSync(imgSrc);

    await new BuildSiteCommand().execute({ engine, config, dendronRoot });
    expect(fs.existsSync(img)).toBeFalsy();
  });

  test("no publsih by default", async () => {
    const config: DendronSiteConfig = {
      noteRoot: "root",
      noteRoots: ["build-site"],
      siteRoot,
      config: {
        "build-site": {
          publishByDefault: false,
        },
      },
    };
    await new BuildSiteCommand().execute({ engine, config, dendronRoot });
    const dir = fs.readdirSync(notesDir);
    // root should exist
    let notePath = path.join(notesDir, "build-site.md");
    expect(fs.existsSync(notePath)).toBeTruthy();
    // non-root should not exist
    notePath = path.join(notesDir, "build-site.one.md");
    expect(fs.existsSync(notePath)).toBeFalsy();
    expect(dir.length).toEqual(1);
  });
});
