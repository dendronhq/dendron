import { launch } from "@dendronhq/api-server";
import {
  DendronSiteConfig,
  DEngineClientV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import {
  FileTestUtils,
  readMD,
  schemaModuleOpts2File,
} from "@dendronhq/common-server";
import {
  EngineTestUtilsV2,
  ENGINE_SERVER,
  NodeTestPresetsV2,
  NodeTestUtilsV2,
} from "@dendronhq/common-test-utils";
import { DendronEngineClient } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import process from "process";
import { BuildSiteCommand } from "../build-site";

const setupCase1 = async ({ vaultDir }: { vaultDir: string }) => {
  await EngineTestUtilsV2.setupVault({
    vaultDir,
    initDirCb: async (vaultPath) => {
      const root = SchemaUtilsV2.createRootModule();
      await schemaModuleOpts2File(root, vaultDir, "root");
      await NodeTestUtilsV2.createNotes({
        vaultPath,
        noteProps: [
          {
            id: "id.foo",
            fname: "foo",
          },
          {
            id: "id.bar.one",
            fname: "bar.one",
          },
        ],
      });
    },
  });
};

const setupCase2 = async ({}: {}) => {
  return EngineTestUtilsV2.setupWS({
    initDirCb: async (vaultPath) => {
      const root = SchemaUtilsV2.createRootModule();
      await schemaModuleOpts2File(root, vaultPath, "root");
      await NodeTestUtilsV2.createNotes({
        vaultPath,
        noteProps: [
          {
            id: "id.foo",
            fname: "foo",
          },
          {
            id: "id.bar.one",
            fname: "bar.one",
          },
        ],
      });
    },
  });
};

const setupCaseCustom = async ({ noteProps }: { noteProps: any[] }) => {
  return await EngineTestUtilsV2.setupVault({
    initDirCb: async (vaultPath) => {
      const root = SchemaUtilsV2.createRootModule();
      await schemaModuleOpts2File(root, vaultPath, "root");
      await NodeTestUtilsV2.createNotes({
        vaultPath,
        noteProps,
      });
    },
  });
};

describe("buildSite v2", () => {
  let wsRoot: string;
  let vault: string;
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
      await setupCase1({ vaultDir: vault });
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
    let vaults: string[];
    beforeEach(async () => {
      ({ wsRoot, vaults } = await setupCase2({}));
      vault = vaults[0];
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
        engineClient,
        config,
        wsRoot,
        writeStubs: false,
      });
      const notesDir = vault;
      const notes = fs.readdirSync(notesDir);
      expect(notes).toMatchSnapshot();
      expect(notes.length).toEqual(6);
    });

    test("write stub", async () => {
      const config: DendronSiteConfig = {
        siteHierarchies: ["foo", "bar"],
        siteRootDir,
      };
      const cmd = new BuildSiteCommand();
      await cmd.execute({
        engineClient,
        config,
        wsRoot,
        writeStubs: true,
      });
      const notesDir = vault;
      const notes = fs.readdirSync(notesDir);
      expect(notes).toMatchSnapshot();
      expect(notes.length).toEqual(7);
    });
  });
});

describe("wiki link", () => {
  let root: string;

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
    root = await setupCaseCustom({
      noteProps: [
        {
          id: "id.foo",
          fname: "foo",
          body: "# Foo Content\n # Bar Content [[missing-link]]",
        },
      ],
    });
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
    root = await setupCaseCustom({
      noteProps: [
        {
          fname: "foo.Mixed_case",
          id: "id.foo.mixed-case",
        },
        {
          fname: "foo.one",
          id: "id.foo.one",
          body: "[[foo.Mixed_case]]",
        },
      ],
    });
    engineClient = DendronEngineClient.create({
      port,
      vaults: [root],
      ws: path.join(root, "../"),
    });
    await engineClient.init();

    const cmd = new BuildSiteCommand();
    const { errors } = await cmd.execute({
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
  let vaultDir: string;

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
    root = await setupCaseCustom({
      noteProps: [
        {
          id: "id.foo",
          fname: "foo",
          body: "# Foo Content\n # Bar Content ((ref:[[bar]]))",
        },
        { id: "id.bar", fname: "bar", body: "# I am bar\n [[foo]]" },
        { id: "id.c", fname: "c" },
      ],
    });
    vaultDir = root;

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

  test("note refs, recursive", async () => {
    const config: DendronSiteConfig = {
      siteHierarchies: ["foo"],
      siteRootDir,
    };
    await NodeTestUtilsV2.createNote({
      vaultDir,
      noteProps: {
        fname: "bar.one",
        body: ["# Bar.One"].join("\n"),
      },
    });
    await NodeTestUtilsV2.createNote({
      vaultDir,
      noteProps: {
        fname: "bar",
        body: ["# Bar", `((ref: [[bar.one]]))`].join("\n"),
      },
    });
    //{ id: "id.bar", fname: "bar", body: "# I am bar\n [[foo]]" },
    const cmd = new BuildSiteCommand();
    await cmd.execute({
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });
    let fooPath = path.join(notesDir, "id.foo.md");
    const { content } = readMD(fooPath);
    expect(content).toMatchSnapshot();
    _.every(["# Bar", "# Bar.One"], (ent) => {
      expect(content.indexOf(ent) >= 0).toBeTruthy();
    });
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

  test(ENGINE_SERVER.NOTE_REF.WILDCARD_LINK.label, async () => {
    let vaults = [{ fsPath: vaultDir }];
    const { note } = await ENGINE_SERVER.NOTE_REF.WILDCARD_LINK.before({
      vaults,
    });
    const results = ENGINE_SERVER.NOTE_REF.WILDCARD_LINK.results;
    await engineClient.init();

    //
    const config: DendronSiteConfig = {
      siteHierarchies: ["journal"],
      siteRootDir,
      usePrettyRefs: false,
    };
    const cmd = new BuildSiteCommand();
    await cmd.execute({
      engineClient,
      config,
      wsRoot: dendronRoot,
      writeStubs,
    });
    let fooPath = path.join(notesDir, note.id + ".md");
    const { content } = readMD(fooPath);
    await NodeTestPresetsV2.runJestHarness({
      expect,
      results,
      opts: { body: content },
    });
  });
});

describe("toc", () => {
  let vaultDir: string;

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
    vaultDir = await EngineTestUtilsV2.setupVault({
      initDirCb: async (vaultDir) => {
        await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
          vaultDir,
        });
      },
    });
  });

  afterEach(() => {
    fs.removeSync(vaultDir);
  });

  test("generate toc", async () => {
    await NodeTestUtilsV2.createNote({
      vaultDir,
      noteProps: {
        id: "bar",
        custom: {
          toc: true,
        },
        fname: "bar",
        body: [
          "# Header1",
          "## Table of Contents",
          "## Header 1.1",
          "",
          "## Header 2",
        ].join("\n"),
      },
    });
    const wsRoot = path.join(vaultDir, "../");
    engineClient = DendronEngineClient.create({
      port,
      vaults: [vaultDir],
      ws: wsRoot,
    });
    await engineClient.init();

    const config: DendronSiteConfig = {
      siteHierarchies: ["bar"],
      siteRootDir,
      usePrettyRefs: true,
    };
    const cmd = new BuildSiteCommand();
    await cmd.execute({
      engineClient,
      config,
      wsRoot,
      writeStubs,
    });
    let fooPath = path.join(notesDir, "bar.md");
    const content = fs.readFileSync(fooPath, { encoding: "utf8" });
    // const { content } = readMD(fooPath);
    expect(content).toMatchSnapshot();
    expect(content.indexOf("[Header 1.1](#header-11)") >= 0).toBeTruthy();
  });

  test("no generate toc", async () => {
    await NodeTestUtilsV2.createNote({
      vaultDir,
      noteProps: {
        id: "bar",
        fname: "bar",
        body: [
          "# Header1",
          "## Table of Contents",
          "## Header 1.1",
          "",
          "## Header 2",
        ].join("\n"),
      },
    });
    const wsRoot = path.join(vaultDir, "../");
    engineClient = DendronEngineClient.create({
      port,
      vaults: [vaultDir],
      ws: wsRoot,
    });
    await engineClient.init();

    const config: DendronSiteConfig = {
      siteHierarchies: ["bar"],
      siteRootDir,
      usePrettyRefs: true,
    };
    const cmd = new BuildSiteCommand();
    await cmd.execute({
      engineClient,
      config,
      wsRoot,
      writeStubs,
    });
    let fooPath = path.join(notesDir, "bar.md");
    const content = fs.readFileSync(fooPath, { encoding: "utf8" });
    // const { content } = readMD(fooPath);
    expect(content).toMatchSnapshot();
    expect(content.indexOf("[Header 1.1](#header-11)") >= 0).toBeFalsy();
  });
});

describe("custom frontmatter", () => {
  let vaultDir: string;

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
    vaultDir = await EngineTestUtilsV2.setupVault({
      initDirCb: async (vaultDir) => {
        await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
          vaultDir,
        });
      },
    });
  });

  afterEach(() => {
    fs.removeSync(vaultDir);
  });

  test("basic", async () => {
    const wsRoot = path.join(vaultDir, "../");
    engineClient = DendronEngineClient.create({
      port,
      vaults: [vaultDir],
      ws: wsRoot,
    });
    await engineClient.init();

    const config: DendronSiteConfig = {
      siteHierarchies: ["foo"],
      siteRootDir,
      usePrettyRefs: true,
      config: {
        foo: {
          customFrontmatter: [
            {
              key: "bond",
              value: 42,
            },
          ],
        },
      },
    };
    const cmd = new BuildSiteCommand();
    await cmd.execute({
      engineClient,
      config,
      wsRoot,
      writeStubs,
    });
    let fooPath = path.join(notesDir, "foo.md");
    const content = fs.readFileSync(fooPath, { encoding: "utf8" });
    // const { content } = readMD(fooPath);
    expect(content).toMatchSnapshot();
    expect(content.indexOf("bond: 42") >= 0).toBeTruthy();
  });

  test("generate toc", async () => {
    await NodeTestUtilsV2.createNote({
      vaultDir,
      noteProps: {
        id: "bar",
        fname: "bar",
        body: [
          "# Header1",
          "## Table of Contents",
          "## Header 1.1",
          "",
          "## Header 2",
        ].join("\n"),
      },
    });
    const wsRoot = path.join(vaultDir, "../");
    engineClient = DendronEngineClient.create({
      port,
      vaults: [vaultDir],
      ws: wsRoot,
    });
    await engineClient.init();

    const config: DendronSiteConfig = {
      siteHierarchies: ["bar"],
      siteRootDir,
      usePrettyRefs: true,
      config: {
        bar: {
          customFrontmatter: [
            {
              key: "toc",
              value: true,
            },
          ],
        },
      },
    };
    const cmd = new BuildSiteCommand();
    await cmd.execute({
      engineClient,
      config,
      wsRoot,
      writeStubs,
    });
    let fooPath = path.join(notesDir, "bar.md");
    const content = fs.readFileSync(fooPath, { encoding: "utf8" });
    // const { content } = readMD(fooPath);
    expect(content).toMatchSnapshot();
    expect(content.indexOf("[Header 1.1](#header-11)") >= 0).toBeTruthy();
  });
});

describe("per hierarchy config", () => {
  let vaultDir: string;
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
    vaultDir = await EngineTestUtilsV2.setupVault({
      initDirCb: async (vaultDir) => {
        await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
          vaultDir,
        });
      },
    });
  });

  afterEach(() => {
    fs.removeSync(vaultDir);
  });

  test("root config set", async () => {
    const wsRoot = path.join(vaultDir, "../");
    engineClient = DendronEngineClient.create({
      port,
      vaults: [vaultDir],
      ws: wsRoot,
    });
    await engineClient.init();

    const config: DendronSiteConfig = {
      siteHierarchies: ["root"],
      siteRootDir,
      usePrettyRefs: true,
      config: {
        root: {
          publishByDefault: false,
        },
      },
    };
    const cmd = new BuildSiteCommand();
    await cmd.execute({
      engineClient,
      config,
      wsRoot,
      writeStubs,
    });
    expect(fs.readdirSync(notesDir)).toEqual([]);
  });

  test("root config and hierarchal config set", async () => {
    const wsRoot = path.join(vaultDir, "../");
    engineClient = DendronEngineClient.create({
      port,
      vaults: [vaultDir],
      ws: wsRoot,
    });
    await engineClient.init();

    const config: DendronSiteConfig = {
      siteHierarchies: ["root"],
      siteRootDir,
      usePrettyRefs: true,
      config: {
        root: {
          publishByDefault: false,
        },
        foo: {
          publishByDefault: true,
        },
      },
    };
    const cmd = new BuildSiteCommand();
    await cmd.execute({
      engineClient,
      config,
      wsRoot,
      writeStubs,
    });
    expect(fs.readdirSync(notesDir)).toEqual(["foo.ch1.md", "foo.md"]);
  });
});
