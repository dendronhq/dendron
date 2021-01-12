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
});
