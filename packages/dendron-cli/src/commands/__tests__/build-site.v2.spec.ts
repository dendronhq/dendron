import { launch } from "@dendronhq/api-server";
import {
  DendronSiteConfig,
  DEngine,
  DEngineClientV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import {
  EngineTestUtils,
  FileTestUtils,
  NodeTestUtils,
  readMD,
  schemaModuleOpts2File,
} from "@dendronhq/common-server";
import { DendronEngineClient } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import process from "process";
import { BuildSiteCommand } from "../build-site";

describe("buildSite", () => {
  let vaultPath: string;
  let engineClient: DEngineClientV2;
  let siteRootDir: string;
  let dendronRoot: string;
  let notesDir: string;
  let writeStubs: boolean;
  let port: number;

  beforeAll(async () => {
    const logPath = process.env["LOG_PATH"];
    port = await launch({ logPath });
  });

  beforeEach(async () => {
    vaultPath = EngineTestUtils.setupStoreDir();
    siteRootDir = FileTestUtils.tmpDir().name;
    dendronRoot = vaultPath;
    notesDir = path.join(siteRootDir, "notes");
    writeStubs = false;
    engineClient = DendronEngineClient.create({
      port,
      vaults: [vaultPath],
      ws: vaultPath,
    });
    await engineClient.init();
  });

  afterEach(() => {
    fs.removeSync(vaultPath);
  });

  test("basic", async () => {
    const config: DendronSiteConfig = {
      siteHierarchies: ["root"],
      siteRootDir,
    };
    await new BuildSiteCommand().execute({
      engine: {} as any,
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });
    const { data, content } = readMD(path.join(notesDir, "foo.md"));
    expect(data.id).toEqual("foo");
    expect(content).toMatchSnapshot("bond");
    expect(data.noindex).toBeUndefined();
    expect(content.indexOf("- [lbl](refactor.one)") >= 0).toBe(true);
    expect(content.indexOf("SECRETS") < 0).toBe(true);
  });

  test("multiple roots", async () => {
    const config: DendronSiteConfig = {
      siteHierarchies: ["foo", "build-site"],
      siteRootDir,
    };
    await new BuildSiteCommand().execute({
      engine: {} as any,
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });
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
    const siteRootDirContents = fs.readdirSync(siteRootDir);
    expect(_.includes(siteRootDirContents, "assets")).toBeTruthy();
  });

  test("image prefix", async () => {
    const config: DendronSiteConfig = {
      siteHierarchies: ["sample"],
      siteRootDir,
      assetsPrefix: "fake-s3.com/",
      copyAssets: false,
    };

    await new BuildSiteCommand().execute({
      engine: {} as any,
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });

    const { content } = readMD(path.join(notesDir, "sample.image-link.md"));
    const dir = fs.readdirSync(siteRootDir);

    expect(content).toMatchSnapshot("sample.image-link.md");

    expect(_.includes(dir, "assets")).toBeFalsy();
    expect(_.trim(content)).toEqual("![link-alt](fake-s3.com/link-path.jpg)");
  });

  test("delete unused asset", async () => {
    const config: DendronSiteConfig = {
      siteHierarchies: ["sample"],
      siteRootDir,
    };
    await new BuildSiteCommand().execute({
      engine: {} as any,
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });
    const img = path.join(siteRootDir, "assets", "images", "foo.jpg");
    expect(fs.existsSync(img)).toBeTruthy();

    // delete image, should be gone
    const imgSrc = path.join(vaultPath, "assets", "images", "foo.jpg");
    fs.unlinkSync(imgSrc);

    await new BuildSiteCommand().execute({
      engine: {} as any,
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });
    expect(fs.existsSync(img)).toBeFalsy();
  });

  test("no publsih by default", async () => {
    const config: DendronSiteConfig = {
      siteHierarchies: ["build-site"],
      siteRootDir,
      config: {
        "build-site": {
          publishByDefault: false,
          noindexByDefault: false,
        },
      },
    };
    await new BuildSiteCommand().execute({
      engine: {} as any,
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });
    const dir = fs.readdirSync(notesDir);
    // root should exist
    let notePath = path.join(notesDir, "build-site.md");
    expect(fs.existsSync(notePath)).toBeTruthy();
    // non-root should not exist
    notePath = path.join(notesDir, "build-site.one.md");
    expect(fs.existsSync(notePath)).toBeFalsy();
    expect(dir.length).toEqual(1);
  });

  test("noindex by default", async () => {
    const config: DendronSiteConfig = {
      siteHierarchies: ["build-site"],
      siteRootDir,
      config: {
        "build-site": {
          publishByDefault: true,
          noindexByDefault: true,
        },
      },
    };
    await new BuildSiteCommand().execute({
      engine: {} as any,
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });
    const dir = fs.readdirSync(notesDir);
    // root should exist
    let notePath = path.join(notesDir, "build-site.md");
    let data: any;
    ({ data } = readMD(notePath));
    expect(data.noindex).toBeTruthy();

    notePath = path.join(notesDir, "id.build-site.one.md");
    ({ data } = readMD(notePath));
    expect(data.noindex).toBeTruthy();

    expect(dir.length).toEqual(2);
  });

  test("ids are converted", async () => {
    const config: DendronSiteConfig = {
      siteHierarchies: ["build-site"],
      siteRootDir,
    };
    await new BuildSiteCommand().execute({
      engine: {} as any,
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });
    let notePath = path.join(notesDir, "build-site.md");
    const { content } = readMD(notePath);
    expect(content).toMatchSnapshot("converted");
    expect(
      content.indexOf("[build-site.one](notes/id.build-site.one)") >= 0
    ).toBeTruthy();
  });

  test("use fallback copy", async () => {
    const config: DendronSiteConfig = {
      siteHierarchies: ["sample"],
      siteRootDir,
    };
    const cmd = new BuildSiteCommand();
    cmd.copyAssets = () => {
      throw Error("bad rsync");
    };
    await cmd.execute({
      engine: {} as any,
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });
    const img = path.join(siteRootDir, "assets", "images", "foo.jpg");
    expect(fs.existsSync(img)).toBeTruthy();
  });
});

describe("buildSite v2", () => {
  let wsRoot: string;
  let vault: string;
  let engine: DEngine;
  let siteRootDir: string;
  let engineClient: DEngineClientV2;
  let port: number;
  //@ts-ignore
  let notesDir: string;

  describe("incremental", () => {
    beforeAll(async () => {
      const logPath = process.env["LOG_PATH"];
      port = await launch({ logPath });
    });

    beforeEach(async () => {
      wsRoot = FileTestUtils.tmpDir().name;
      vault = path.join(wsRoot, "vault");
      fs.ensureDirSync(vault);
      EngineTestUtils.setupStoreDir({
        copyFixtures: false,
        storeDstPath: vault,
        initDirCb: async (dirPath: string) => {
          const root = SchemaUtilsV2.createRootModule();
          await schemaModuleOpts2File(root, dirPath, "root");
          NodeTestUtils.createNotes(dirPath, [
            {
              id: "id.foo",
              fname: "foo",
            },
            {
              id: "id.bar.one",
              fname: "bar.one",
            },
          ]);
        },
      });
      engine = {} as any;
      siteRootDir = path.join(wsRoot, "docs");
      fs.ensureDir(siteRootDir);
      notesDir = path.join(siteRootDir, "notes");
      engineClient = DendronEngineClient.create({
        port,
        vaults: [vault],
        ws: wsRoot,
      });
      await engineClient.init();
    });

    afterEach(() => {
      fs.removeSync(wsRoot);
    });

    test("basic", async () => {
      const config: DendronSiteConfig = {
        siteHierarchies: ["foo", "bar"],
        siteRootDir,
      };
      const cmd = new BuildSiteCommand();
      await cmd.execute({
        engine,
        engineClient,
        config,
        wsRoot,
        writeStubs: false,
        incremental: true,
      });

      // check storage notes no change
      const notes = fs.readdirSync(vault);
      expect(notes.length).toEqual(4);

      // chekc site notes
      const sitePath = path.join(siteRootDir, "notes");
      const entries = fs.readdirSync(sitePath);
      expect(entries.length).toEqual(3);
    });
  });

  describe("write stubs", () => {
    beforeEach(async () => {
      wsRoot = await EngineTestUtils.setupStoreDir({
        copyFixtures: false,
        initDirCb: async (dirPath: string) => {
          vault = dirPath;
          const root = SchemaUtilsV2.createRootModule();
          await schemaModuleOpts2File(root, dirPath, "root");
          NodeTestUtils.createNotes(dirPath, [
            {
              id: "id.foo",
              fname: "foo",
            },
            {
              id: "id.bar.one",
              fname: "bar.one",
            },
          ]);
        },
      });
      engine = {} as any;
      siteRootDir = FileTestUtils.tmpDir().name;
      notesDir = path.join(siteRootDir, "notes");
      engineClient = DendronEngineClient.create({
        port,
        vaults: [vault],
        ws: wsRoot,
      });
      await engineClient.init();
    });

    afterEach(() => {
      fs.removeSync(wsRoot);
    });

    test("no write stub", async () => {
      const config: DendronSiteConfig = {
        siteHierarchies: ["foo", "bar"],
        siteRootDir,
      };
      const cmd = new BuildSiteCommand();
      await cmd.execute({
        engine,
        engineClient,
        config,
        wsRoot,
        writeStubs: false,
      });
      const notesDir = wsRoot;
      const notes = fs.readdirSync(notesDir);
      expect(notes).toMatchSnapshot();
      expect(notes.length).toEqual(4);
    });

    test("write stub", async () => {
      const config: DendronSiteConfig = {
        siteHierarchies: ["foo", "bar"],
        siteRootDir,
      };
      const cmd = new BuildSiteCommand();
      await cmd.execute({
        engine,
        engineClient,
        config,
        wsRoot,
        writeStubs: true,
      });
      const notesDir = wsRoot;
      const notes = fs.readdirSync(notesDir);
      expect(notes).toMatchSnapshot();
      expect(notes.length).toEqual(5);
    });
  });
});

describe("wiki link", () => {
  let root: string;
  let engine: DEngine;
  let siteRootDir: string;
  let notesDir: string;
  let writeStubs = false;
  let engineClient: DEngineClientV2;
  let port: number;

  beforeAll(async () => {
    const logPath = process.env["LOG_PATH"];
    port = await launch({ logPath });
  });

  beforeEach(async () => {
    siteRootDir = FileTestUtils.tmpDir().name;
    notesDir = path.join(siteRootDir, "notes");
  });

  afterEach(() => {
    fs.removeSync(root);
  });

  test("missing link", async () => {
    root = await EngineTestUtils.setupStoreDir({
      copyFixtures: false,
      initDirCb: async (dirPath: string) => {
        root = dirPath;
        await schemaModuleOpts2File(
          SchemaUtilsV2.createRootModule(),
          dirPath,
          "root"
        );
        NodeTestUtils.createNotes(dirPath, [
          {
            id: "id.foo",
            fname: "foo",
            body: "# Foo Content\n # Bar Content [[missing-link]]",
          },
        ]);
      },
    });
    engine = {} as any;
    engineClient = DendronEngineClient.create({
      port,
      vaults: [root],
      ws: path.join(root, "../"),
    });
    await engineClient.init();
    const config: DendronSiteConfig = {
      siteHierarchies: ["foo"],
      siteRootDir,
    };
    const cmd = new BuildSiteCommand();
    const { errors } = await cmd.execute({
      engine,
      engineClient,
      config,
      wsRoot: root,
      writeStubs,
    });
    let fooPath = path.join(notesDir, "id.foo.md");
    const { content } = readMD(fooPath);
    expect(content).toMatchSnapshot();
    expect(content.indexOf("[missing-link](/404.html)") >= 0).toBeTruthy();
    expect(errors).toMatchSnapshot();
    expect(errors).toEqual([{ links: ["missing-link"], source: "foo" }]);
  });

  test("case sensitive link", async () => {
    const config: DendronSiteConfig = {
      siteHierarchies: ["foo"],
      siteRootDir,
    };
    root = EngineTestUtils.setupStoreDir({
      copyFixtures: false,
      initDirCb: async (dirPath: string) => {
        await schemaModuleOpts2File(
          SchemaUtilsV2.createRootModule(),
          dirPath,
          "root"
        );
        NodeTestUtils.createNotes(dirPath, [
          {
            fname: "foo.Mixed_case",
            id: "id.foo.mixed-case",
          },
          {
            fname: "foo.one",
            id: "id.foo.one",
            body: "[[foo.Mixed_case]]",
          },
        ]);
      },
    });
    engine = {} as any;
    engineClient = DendronEngineClient.create({
      port,
      vaults: [root],
      ws: path.join(root, "../"),
    });
    await engineClient.init();

    const cmd = new BuildSiteCommand();
    const { errors } = await cmd.execute({
      engine,
      engineClient,
      config,
      wsRoot: root,
      writeStubs,
    });
    let fooPath = path.join(notesDir, "id.foo.one.md");
    const { content } = readMD(fooPath);
    expect(content).toMatchSnapshot();
    expect(
      content.indexOf("[foo.Mixed_case](id.foo.mixed-case)") >= 0
    ).toBeTruthy();
    expect(errors).toEqual([]);
  });
});

describe("note refs", () => {
  let root: string;
  let engine: DEngine;
  let siteRootDir: string;
  let dendronRoot: string;
  let notesDir: string;
  let writeStubs = false;
  let engineClient: DEngineClientV2;
  let port: number;

  beforeAll(async () => {
    const logPath = process.env["LOG_PATH"];
    port = await launch({ logPath });
  });

  beforeEach(async () => {
    root = EngineTestUtils.setupStoreDir({
      copyFixtures: false,
      initDirCb: async (dirPath: string) => {
        await schemaModuleOpts2File(
          SchemaUtilsV2.createRootModule(),
          dirPath,
          "root"
        );
        NodeTestUtils.createNotes(dirPath, [
          {
            id: "id.foo",
            fname: "foo",
            body: "# Foo Content\n # Bar Content ((ref:[[bar]]))",
          },
          { id: "id.bar", fname: "bar", body: "# I am bar\n [[foo]]" },
          { id: "id.c", fname: "c" },
        ]);
      },
    });
    engine = {} as any;
    siteRootDir = FileTestUtils.tmpDir().name;
    dendronRoot = root;
    notesDir = path.join(siteRootDir, "notes");
    engineClient = DendronEngineClient.create({
      port,
      vaults: [root],
      ws: path.join(root, "../"),
    });
    await engineClient.init();
  });

  afterEach(() => {
    fs.removeSync(root);
  });

  test("note refs", async () => {
    const config: DendronSiteConfig = {
      siteHierarchies: ["foo"],
      siteRootDir,
    };
    const cmd = new BuildSiteCommand();
    await cmd.execute({
      engine,
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });
    let fooPath = path.join(notesDir, "id.foo.md");
    const { content } = readMD(fooPath);
    expect(content).toMatchSnapshot();
    expect(content.indexOf("[foo](notes/id.foo)") >= 0).toBeTruthy();
    expect(content.indexOf("portal-container") >= 0).toBeTruthy();
  });

  test("note refs, disable pretty", async () => {
    const config: DendronSiteConfig = {
      siteHierarchies: ["foo"],
      siteRootDir,
      usePrettyRefs: false,
    };
    const cmd = new BuildSiteCommand();
    await cmd.execute({
      engine,
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });
    let fooPath = path.join(notesDir, "id.foo.md");
    const { content } = readMD(fooPath);
    expect(content).toMatchSnapshot();
    expect(content.indexOf("portal-container") >= 0).toBeFalsy();
  });
});
