import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import { FileTestUtils, NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import {
  MarkdownExportPod,
  MarkdownImportPod,
  MarkdownPublishPod,
} from "@dendronhq/pods-core";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";
import { checkNotInString, checkString } from "../../utils";

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
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(vpath, [
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
        const note = NoteUtils.getNoteOrThrow({
          fname: "project.p2.n1",
          notes: engine.notes,
          vault,
          wsRoot,
        });
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
        const note = NoteUtils.getNoteOrThrow({
          fname: "project.p1.n1",
          notes: engine.notes,
          vault: vaults[0],
          wsRoot,
        });
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
        const note = NoteUtils.getNoteOrThrow({
          fname: "project.p1.n1",
          notes: engine.notes,
          vault: vaults[0],
          wsRoot,
        });
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
          },
        });
        const vault = vaults[0];
        vpath = vault2Path({ wsRoot, vault });
        const assetsDir = fs.readdirSync(path.join(vpath, "assets"));
        expect(assetsDir.length).toEqual(2);
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
});

describe("markdown export pod", () => {
  let exportDest: string;

  beforeAll(() => {
    exportDest = tmpDir().name;
  });

  test("test nested directory output", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new MarkdownExportPod();
        engine.config.useFMTitle = true;
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
        expect(expectedFiles).toEqual(actualFiles);

        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          path.join(exportDest, "vault1"),
          ["bar.md", "foo.md", "root.md", "foo"] // foo is a directory
        );
        expect(expectedFiles).toEqual(actualFiles);

        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          path.join(exportDest, "vault1", "foo"),
          ["ch1.md"]
        );
        expect(expectedFiles).toEqual(actualFiles);

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
        engine.config.useFMTitle = true;
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
        expect(expectedFiles).toEqual(actualFiles);

        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          path.join(exportDest, "vault1", "assets/images"),
          ["test.png"]
        );
        expect(expectedFiles).toEqual(actualFiles);

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
          await fs.ensureDir(
            path.join(wsRoot, vaults[0].fsPath, "assets/images")
          );
          await fs.writeFile(
            path.join(wsRoot, vaults[0].fsPath, "assets/images/test.png"),
            "hello world"
          );
        },
      }
    );
  });

  // Wikilinks need to have their referenced pages converted from dot notation to folder hierarchies
  test("test wikilink conversion", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        debugger;
        const pod = new MarkdownExportPod();
        engine.config.useFMTitle = true;
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
          ["root.md", "simple-wikilink.md", "simple-wikilink"]
        );
        expect(expectedFiles).toEqual(actualFiles);

        [actualFiles, expectedFiles] = FileTestUtils.cmpFiles(
          path.join(exportDest, "vault1", "simple-wikilink"),
          ["one.md"]
        );
        expect(expectedFiles).toEqual(actualFiles);

        // check contents
        const foo = fs.readFileSync(
          path.join(exportDest, "vault1", "simple-wikilink.md"),
          {
            encoding: "utf8",
          }
        );
        debugger;
        expect(foo).toMatchSnapshot("note link reference");
        await checkString(foo, "[One](simple-wikilink/one)");
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
        },
      }
    );
  });
});
