import { WorkspaceOpts } from "@dendronhq/common-all/";
import {
  ENGINE_HOOKS,
  PODS_CORE,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import { MarkdownImportPod, MarkdownPublishPod } from "../MarkdownPod";
import { runEngineTestV5 } from "@dendronhq/engine-test-utils";
import { VaultUtils } from "@dendronhq/common-all";

const createEngine = (opts: WorkspaceOpts) => {
  return DendronEngineV2.createV3(opts);
};

describe("MarkdownImport Pod", () => {
  const {
    ROOT_WITH_MULT_FOLDERS,
    SPECIAL_CHARS,
    CONVERT_LINKS,
  } = PODS_CORE.MARKDOWN.IMPORT;
  test("root with mult folders", async () => {
    await runEngineTestV4(ROOT_WITH_MULT_FOLDERS.testFunc, {
      expect,
      createEngine,
      preSetupHook: ROOT_WITH_MULT_FOLDERS.preSetupHook,
      extra: {
        pod: new MarkdownImportPod(),
      },
    });
  });

  test("root with special chars", async () => {
    await runEngineTestV4(SPECIAL_CHARS.testFunc, {
      expect,
      createEngine,
      preSetupHook: SPECIAL_CHARS.preSetupHook,
      extra: {
        pod: new MarkdownImportPod(),
      },
    });
  });

  test("root with special chars", async () => {
    await runEngineTestV4(CONVERT_LINKS.testFunc, {
      expect,
      createEngine,
      preSetupHook: CONVERT_LINKS.preSetupHook,
      extra: {
        pod: new MarkdownImportPod(),
      },
    });
  });
});

describe("MarkdownPublishPod", () => {
  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const fname = "foo";
        const vault = vaults[0];
        const vaultName = VaultUtils.getName(vault);
        const resp = await new MarkdownPublishPod().execute({
          engine,
          vaults,
          wsRoot,
          config: {
            fname,
            vault: vaultName,
            dest: "stdout",
          },
        });
        expect(resp).toEqual("foo body");
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("schema with template", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const vaultName = VaultUtils.getName(vault);
        const fnames = ["bar.template.ch1", "bar.template.ch2"];
        const resp = await Promise.all(
          fnames.map(async (fname) => {
            return new MarkdownPublishPod().execute({
              engine,
              vaults,
              wsRoot,
              config: {
                fname,
                vault: vaultName,
                dest: "stdout",
              },
            });
          })
        );
        expect(resp).toEqual(["ch1 template", "ch2 template"]);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupSchemaPreseet,
      }
    );
  });

  test("schema with namespace template", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const vaultName = VaultUtils.getName(vault);
        const fnames = ["daily", "journal.template"];
        const resp = await Promise.all(
          fnames.map(async (fname) => {
            return new MarkdownPublishPod().execute({
              engine,
              vaults,
              wsRoot,
              config: {
                fname,
                vault: vaultName,
                dest: "stdout",
              },
            });
          })
        );
        expect(resp).toEqual(["Journal", "Template text"]);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupSchemaPresetWithNamespaceTemplate,
      }
    );
  });

  test("recursive note refs", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const vaultName = VaultUtils.getName(vault);
        const fnames = ["foo.one", "foo.two"];
        const resp = await Promise.all(
          fnames.map(async (fname) => {
            return new MarkdownPublishPod().execute({
              engine,
              vaults,
              wsRoot,
              config: {
                fname,
                vault: vaultName,
                dest: "stdout",
              },
            });
          })
        );
        const fooOneBody = `# Foo.One\n\n((ref:[[foo.two]]))\nRegular wikilink: [[foo.two]]`;
        const fooTwoBody = `# Foo.Two\n\nblah`;
        expect(resp).toEqual([fooOneBody, fooTwoBody]);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupNoteRefRecursive,
      }
    );
  });

  test("journal", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const vaultName = VaultUtils.getName(vault);
        const fnames = [
          "daily",
          "daily.journal",
          "daily.journal.2020",
          "daily.journal.2020.07",
          "daily.journal.2020.07.01.one",
          "daily.journal.2020.07.05.two",
        ];
        const resp = await Promise.all(
          fnames.map(async (fname) => {
            return new MarkdownPublishPod().execute({
              engine,
              vaults,
              wsRoot,
              config: {
                fname,
                vault: vaultName,
                dest: "stdout",
              },
            });
          })
        );
        expect(resp).toEqual(["", "", "", "", "", ""]);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupJournals,
      }
    );
  });
});
