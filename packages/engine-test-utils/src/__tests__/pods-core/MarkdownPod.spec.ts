import {
  ConfigService,
  ConfigUtils,
  URI,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  FileTestUtils,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import {
  MarkdownExportPod,
  MarkdownImportPod,
  MarkdownPublishPod,
} from "@dendronhq/pods-core";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { TestConfigUtils } from "../../config";
import { createPublishingConfig, runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";
import { checkNotInString, checkString, TestSeedUtils } from "../../utils";

const setupBasic = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "parent",
    body: [`Test: [[Link| foo.one]]`].join("\n"),
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "foo.one",
    body: [`## Test`].join("\n"),
  });
};
const setupBasicMulti = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  // Creating a note of the same name in multiple vaults to check that it gets the right one
  await NoteTestUtilsV4.createNote({
    props: {
      id: "test2",
    },
    vault: vaults[1],
    wsRoot,
    fname: "target",
    body: ["Sint quo sunt maxime.", "Nisi nam dolorem qui ut minima."].join(
      "\n"
    ),
  });
  await NoteTestUtilsV4.createNote({
    props: {
      id: "test1",
    },
    vault: vaults[0],
    wsRoot,
    fname: "target",
    body: "Voluptatem possimus harum nisi.",
  });
  await NoteTestUtilsV4.createNote({
    vault: vaults[0],
    wsRoot,
    fname: "source",
    body: `[[dendron://${VaultUtils.getName(vaults[0])}/target]]`,
  });
};
const setupRefWithAnchor = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "parent",
    body: "![[child]]",
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "child",
    body: "Hello World ^Ddu3OTwrJYvI",
  });
};

describe("markdown publish pod", () => {
  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownPublishPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const resp = await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            fname: "foo",
            vaultName,
            dest: "stdout",
          },
        });
        expect(resp).toMatchSnapshot();
        await checkString(resp, "foo body", "# Foo");
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });

  test("ref", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownPublishPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const resp = await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            fname: "simple-note-ref",
            vaultName,
            dest: "stdout",
          },
        });
        expect(resp).toMatchSnapshot();
        await checkString(resp, "# Header", "body text");
        await checkNotInString(resp, "portal");
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupRefs }
    );
  });

  test("markdown publish to ignore block anchors in ref content", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownPublishPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const resp = await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            fname: "parent",
            vaultName,
            dest: "stdout",
          },
        });
        expect(resp).toEqual("# Parent\n\nHello World");
        await checkNotInString(resp, "Ddu3OTwrJYvI");
      },
      { expect, preSetupHook: setupRefWithAnchor }
    );
  });

  test("wikiLinktoURL with siteUrl", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownPublishPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const config = await TestConfigUtils.withConfig(
          (config) => {
            const defaultConfig = ConfigUtils.genDefaultConfig();
            ConfigUtils.setProp(
              defaultConfig,
              "publishing",
              createPublishingConfig({
                siteHierarchies: ["test-wikilink-to-url"],
                siteRootDir: "docs",
              })
            );
            ConfigUtils.setVaults(defaultConfig, ConfigUtils.getVaults(config));
            return defaultConfig;
          },
          { wsRoot }
        );
        const resp = await pod.execute({
          engine,
          vaults,
          wsRoot,
          dendronConfig: config,
          config: {
            fname: "parent",
            vaultName,
            dest: "stdout",
            wikiLinkToURL: true,
          },
        });
        // note id is foo.one, hence notes/foo.one
        expect(resp).toContain("(https://localhost:8080/notes/foo.one)");
        await checkString(resp, "[Link](https://localhost:8080/notes/foo.one)");
      },
      { expect, preSetupHook: setupBasic }
    );
  });

  test("test with xvault link to same vault", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownPublishPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const config = await TestConfigUtils.withConfig(
          (config) => {
            const defaultConfig = ConfigUtils.genDefaultConfig();
            ConfigUtils.setWorkspaceProp(
              defaultConfig,
              "enableXVaultWikiLink",
              true
            );
            ConfigUtils.setProp(
              defaultConfig,
              "publishing",
              createPublishingConfig({
                siteHierarchies: ["test-wikilink-to-url"],
                siteRootDir: "docs",
              })
            );
            ConfigUtils.setVaults(defaultConfig, ConfigUtils.getVaults(config));
            return defaultConfig;
          },
          { wsRoot }
        );

        const resp = await pod.execute({
          engine,
          vaults,
          wsRoot,
          dendronConfig: config,
          config: {
            fname: "source",
            vaultName,
            dest: "stdout",
            wikiLinkToURL: true,
          },
        });
        // note id is foo.one, hence notes/foo.one
        expect(resp).toContain("https://localhost:8080/notes/test1");
        await checkNotInString(resp, "https://localhost:8080/notes/test2");
      },
      { expect, preSetupHook: setupBasicMulti }
    );
  });

  test.skip("test with regular link in a seed", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        await TestSeedUtils.addSeed2WS({
          wsRoot,
          engine,
          modifySeed: (seed) => {
            seed.site = {
              url: "https://foo.com",
            };
            return seed;
          },
        });
        const seedId = TestSeedUtils.defaultSeedId();
        const config = (
          await ConfigService.instance().readConfig(URI.file(wsRoot))
        )._unsafeUnwrap();
        const vaultsConfig = ConfigUtils.getVaults(config);
        engine.vaults = vaultsConfig;
        const vault = VaultUtils.getVaultByName({
          vaults: engine.vaults,
          vname: seedId,
        })!;
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          vault,
          wsRoot,
          body: `Lorem ipsum`,
        });
        await NoteTestUtilsV4.createNote({
          fname: "parent",
          vault,
          wsRoot,
          body: `[[foo]]`,
        });
        const pod = new MarkdownPublishPod();

        const resp = await pod.execute({
          engine,
          vaults,
          wsRoot,
          dendronConfig: config,
          config: {
            fname: "parent",
            vaultName: seedId,
            dest: "stdout",
            wikiLinkToURL: true,
          },
        });
        expect(resp).toContain("https://foo.com");
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });
});

function setupImport(src: string) {
  return FileTestUtils.createFiles(src, [
    { path: "project/p2/n1.md" },
    { path: "project/p1/n1.md" },
    { path: "project/p1/n2.md" },
    { path: "project/p1/.DS_STORE_TEST" },
    { path: "project/p1/n3.pdf" },
    { path: "project/p1/n1.pdf" },
    { path: "project/p1/n1.pdf" },
    { path: "project/p.3/n1.md" },
    { path: "project/p4/test.txt" },
    { path: "A1/B1.md" },
    { path: "A1/B2.md" },
    { path: "A1/B1 B2.md" },
    { path: "Folder/Media/something.md" },
    { path: "Folder/Media/image.JPEG" },
  ]);
}

describe("markdown import pod", () => {
  let importSrc: string;
  let vpath: string;
  let pod: MarkdownImportPod;

  beforeEach(() => {
    importSrc = tmpDir().name;
    pod = new MarkdownImportPod();
  });

  afterEach(() => {
    // make sure files are there
    const [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(vpath, [
      "project.p1.n1.md",
      "project.p1.n2.md",
      "project.p2.n1.md",
      "project.p-3.n1.md",
      "root.md",
      "root.schema.yml",
    ]);
    expect(_.intersection(expectedFiles, actualFiles).length).toEqual(6);
  });

  test("convert obsidian link", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const vault = vaults[0];
        const vaultName = VaultUtils.getName(vault);
        vpath = vault2Path({ wsRoot, vault });
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            src: importSrc,
            vaultName,
          },
        });
        const note = (
          await engine.findNotes({
            fname: "project.p2.n1",
            vault,
          })
        )[0];
        expect(_.trim(note.body)).toEqual("[[project.p1.n1]]");
      },
      {
        expect,
        preSetupHook: async () => {
          await setupImport(importSrc);
          fs.writeFileSync(
            path.join(importSrc, "project", "p2", "n1.md"),
            "[[project/p1/n1]]"
          );
        },
      }
    );
  });

  test("fname as id ", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            concatenate: false,
            src: importSrc,
            vaultName,
            fnameAsId: true,
          },
        });
        const vault = vaults[0];
        vpath = vault2Path({ wsRoot, vault });
        const note = (
          await engine.findNotes({
            fname: "project.p1.n1",
            vault: vaults[0],
          })
        )[0];
        expect(note.id).toEqual("project.p1.n1");
      },
      {
        expect,
        preSetupHook: async () => {
          await setupImport(importSrc);
        },
      }
    );
  });

  test("with frontmatter ", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            concatenate: false,
            src: importSrc,
            vaultName,
            frontmatter: {
              banana: 42,
            },
          },
        });
        const vault = vaults[0];
        vpath = vault2Path({ wsRoot, vault });
        const note = (
          await engine.findNotes({
            fname: "project.p1.n1",
            vault: vaults[0],
          })
        )[0];
        expect(note.custom.banana).toEqual(42);
      },
      {
        expect,
        preSetupHook: async () => {
          await setupImport(importSrc);
        },
      }
    );
  });

  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            concatenate: false,
            src: importSrc,
            vaultName,
            noAddUUID: true,
          },
        });
        const vault = vaults[0];
        vpath = vault2Path({ wsRoot, vault });
        const assetsDir = fs.readdirSync(path.join(vpath, "assets"));
        expect(assetsDir.length).toEqual(4);
        const fileBody = fs.readFileSync(path.join(vpath, "project.p1.md"), {
          encoding: "utf8",
        });
        expect(fileBody.match("n1.pdf")).toBeTruthy();
        expect(fileBody.match("n3.pdf")).toBeTruthy();
      },
      {
        expect,
        preSetupHook: async () => {
          await setupImport(importSrc);
        },
      }
    );
  });

  test("update asset reference in md", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const vault = vaults[0];
        vpath = vault2Path({ wsRoot, vault });
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            concatenate: false,
            src: importSrc,
            vaultName,
            noAddUUID: true,
          },
        });
        const assetsDir = fs.readdirSync(path.join(vpath, "assets"));
        const fileBody = fs.readFileSync(path.join(vpath, "project.p4.md"), {
          encoding: "utf8",
        });
        const fileBodyContent = fs.readFileSync(
          path.join(vpath, "project.p2.n1.md"),
          {
            encoding: "utf8",
          }
        );
        const fileBody2Content = fs.readFileSync(
          path.join(vpath, "project.p4.n1.md"),
          {
            encoding: "utf8",
          }
        );
        const fileBody3Content = fs.readFileSync(
          path.join(vpath, "folder.media.something.md"),
          {
            encoding: "utf8",
          }
        );
        expect(fileBody.match("test.txt")).toBeTruthy();
        const assetPath = path.posix.join("assets", "test.txt");
        const imagePath = path.posix.join("assets", "image.JPEG");
        expect(fileBodyContent).toContain(`[test-pdf](/${assetPath})`);
        expect(fileBody2Content).toContain(`[test-pdf](/${assetPath})`);
        expect(fileBody3Content).toContain(`![image](/${imagePath})`);
        expect(assetsDir.length).toEqual(4);
      },
      {
        expect,
        preSetupHook: async () => {
          await setupImport(importSrc);
          fs.writeFileSync(
            path.join(importSrc, "project", "p2", "n1.md"),
            "[test-pdf](/project/p4/test.txt)"
          );
          fs.writeFileSync(
            path.join(importSrc, "project", "p4", "n1.md"),
            "[test-pdf](./test.txt)"
          );
          fs.writeFileSync(
            path.join(importSrc, "Folder", "Media", "something.md"),
            "![image](image.JPEG)"
          );
        },
      }
    );
  });

  test("convert obsidian wikilink", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const vault = vaults[0];
        vpath = vault2Path({ wsRoot, vault });
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            concatenate: false,
            src: importSrc,
            vaultName,
            noAddUUID: true,
          },
        });
        const B1fileBody = fs.readFileSync(path.join(vpath, "a1.b1.md"), {
          encoding: "utf8",
        });
        const B2fileBody = fs.readFileSync(path.join(vpath, "a1.b2.md"), {
          encoding: "utf8",
        });
        expect(B1fileBody).toContain(`[[a1.b2]]`);
        expect(B2fileBody).toContain(`[[a1.b1-b2]]`);
      },
      {
        expect,
        preSetupHook: async () => {
          await setupImport(importSrc);
          fs.writeFileSync(path.join(importSrc, "A1", "B1.md"), "[[B2]]");
          fs.writeFileSync(path.join(importSrc, "A1", "B2.md"), "[[B1 B2]]");
          fs.writeFileSync(
            path.join(importSrc, "A1", "B1 B2.md"),
            "Hello World"
          );
        },
      }
    );
  });

  test("only necessary parts of files are modified", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const vault = vaults[0];
        vpath = vault2Path({ wsRoot, vault });
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            concatenate: false,
            src: importSrc,
            vaultName,
            noAddUUID: true,
          },
        });
        const B1fileBody = fs.readFileSync(path.join(vpath, "a1.b1.md"), {
          encoding: "utf8",
        });
        const B2fileBody = fs.readFileSync(path.join(vpath, "a1.b2.md"), {
          encoding: "utf8",
        });
        // Making sure the whitespace around them is maintained. If not, that would indicate we are reformatting the files.
        expect(B1fileBody).toContain(`hello  [[a1.b2]] world`);
        expect(B2fileBody).toContain(`\n\n[[a1.b1-b2]]\n\n`);
      },
      {
        expect,
        preSetupHook: async () => {
          await setupImport(importSrc);
          fs.writeFileSync(
            path.join(importSrc, "A1", "B1.md"),
            "hello  [[B2]] world"
          );
          fs.writeFileSync(
            path.join(importSrc, "A1", "B2.md"),
            "\n\n[[B1 B2]]\n\n"
          );
          fs.writeFileSync(
            path.join(importSrc, "A1", "B1 B2.md"),
            "Hello World"
          );
        },
      }
    );
  });

  test("import note's frontmatter", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownImportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const vault = vaults[0];
        vpath = vault2Path({ wsRoot, vault });
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            concatenate: false,
            src: importSrc,
            vaultName,
            importFrontmatter: true,
            frontmatterMapping: {
              id: "obsidianId",
            },
          },
        });
        const note = (
          await engine.findNotes({
            fname: "frontmatterTest",
            vault,
          })
        )[0];
        expect(note.custom.obsidianId).toContain(`testing`);
        expect(note.custom.status).toContain(`wip`);
        expect(note.custom.created_imported).toContain(`10 Jan`);
      },
      {
        expect,
        preSetupHook: async () => {
          await setupImport(importSrc);
          const content = `---\nid: testing\ncreated: 10 Jan\nstatus: wip\n---\nHello World`;
          fs.writeFileSync(path.join(importSrc, "frontmatterTest.md"), content);
        },
      }
    );
  });
});

describe("markdown export pod", () => {
  let exportDest: string;

  beforeAll(() => {
    exportDest = tmpDir().name;
  });

  afterEach(() => {
    // clean up the export directory after each test.
    fs.rmdirSync(exportDest, { recursive: true });
  });

  test("test nested directory output", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownExportPod();
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            dest: exportDest,
          },
        });

        // check folder contents
        let [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(exportDest, [
          "vault1",
          "vault2",
          "vaultThree",
        ]);
        expect(actualFiles).toEqual(expectedFiles);

        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          path.join(exportDest, "vault1"),
          ["bar.md", "foo.md", "root.md", "foo"] // foo is a directory
        );
        expect(actualFiles).toEqual(expectedFiles);

        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          path.join(exportDest, "vault1", "foo"),
          ["ch1.md"]
        );
        expect(actualFiles).toEqual(expectedFiles);

        // check contents
        const foo = fs.readFileSync(
          path.join(exportDest, "vault1", "foo", "ch1.md"),
          {
            encoding: "utf8",
          }
        );
        expect(foo).toMatchSnapshot("foo ch1 contents");
        await checkString(foo, "foo.ch1 body");
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });

  test("test copying of assets", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownExportPod();
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            dest: exportDest,
          },
        });

        let [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          path.join(exportDest, "vault1"),
          ["root.md", "assets"]
        );
        expect(actualFiles).toEqual(expectedFiles);

        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          path.join(exportDest, "vault1", "assets/images"),
          ["test.png"]
        );
        expect(actualFiles).toEqual(expectedFiles);

        // check contents
        const foo = fs.readFileSync(
          path.join(exportDest, "vault1", "assets/images", "test.png"),
          {
            encoding: "utf8",
          }
        );
        expect(foo).toMatchSnapshot("asset contents");
        await checkString(foo, "hello world");
      },
      {
        expect,
        preSetupHook: async ({ wsRoot, vaults }) => {
          const rootDir = path.join(
            wsRoot,
            VaultUtils.getRelPath(vaults[0]),
            "assets/images"
          );
          await fs.ensureDir(rootDir);
          await fs.writeFile(path.join(rootDir, "test.png"), "hello world");
        },
      }
    );
  });

  // Wikilinks need to have their referenced pages converted from dot notation to folder hierarchies
  test("test wikilink conversion", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownExportPod();
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            dest: exportDest,
          },
        });

        let [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          path.join(exportDest, "vault1"),
          [
            "root.md",
            "simple-wikilink.md",
            "simple-wikilink",
            "wikilink-top-hierarchy.md",
            "wikilink-top-hierarchy-target.md",
          ]
        );
        expect(actualFiles).toEqual(expectedFiles);

        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          path.join(exportDest, "vault1", "simple-wikilink"),
          ["one.md"]
        );
        expect(actualFiles).toEqual(expectedFiles);

        // check contents
        let foo = fs.readFileSync(
          path.join(exportDest, "vault1", "simple-wikilink.md"),
          {
            encoding: "utf8",
          }
        );
        expect(foo).toMatchSnapshot("note link reference");
        await checkString(foo, "[One](/simple-wikilink/one.md)");

        // Now do a comparison for a note reference at the top level hierarchy
        // check contents
        foo = fs.readFileSync(
          path.join(exportDest, "vault1", "wikilink-top-hierarchy.md"),
          {
            encoding: "utf8",
          }
        );
        expect(foo).toMatchSnapshot("top hierarchy note link reference");
        await checkString(
          foo,
          "[Wikilink Top Hierarchy Target](/wikilink-top-hierarchy-target.md)"
        );
      },
      {
        expect,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_WITH_WIKILINK_SIMPLE.create({
            wsRoot,
            vault: vaults[0],
          });
          await NOTE_PRESETS_V4.NOTE_WITH_WIKILINK_SIMPLE_TARGET.create({
            wsRoot,
            vault: vaults[0],
          });
          await NOTE_PRESETS_V4.NOTE_WITH_WIKILINK_TOP_HIERARCHY.create({
            wsRoot,
            vault: vaults[0],
          });
          await NOTE_PRESETS_V4.NOTE_WITH_WIKILINK_TOP_HIERARCHY_TARGET.create({
            wsRoot,
            vault: vaults[0],
          });
        },
      }
    );
  });
});
