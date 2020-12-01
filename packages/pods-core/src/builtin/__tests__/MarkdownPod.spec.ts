import { WorkspaceOpts } from "@dendronhq/common-all/";
import { PODS_CORE, runEngineTestV4 } from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import { MarkdownImportPod } from "../MarkdownPod";

const createEngine = (opts: WorkspaceOpts) => {
  return DendronEngineV2.createV3(opts);
};

describe("MarkdownPod", () => {
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
