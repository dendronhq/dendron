import { ENGINE_HOOKS } from "../../presets";
import { NotionExportPod } from "@dendronhq/pods-core";
import { runEngineTestV5 } from "../../engine";
import { VaultUtils } from "@dendronhq/common-all";

describe("Notion export pod basic", () => {
  const utilityMethods = {
    withProgressOpts: {
      withProgress: jest.fn().mockResolvedValue({ Page1: "sgwhwhwwie" }),
      location: "Notification",
    },
    getSelectionFromQuickpick: jest.fn().mockResolvedValue("Page1"),
  };
  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new NotionExportPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        pod.createPagesInNotion = jest.fn();
        pod.getAllNotionPages = jest.fn();
        pod.convertMdToNotionBlock = jest.fn();
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            vault: vaultName,
            dest: "TODO",
            apiKey: "hddkeosndbfjw",
          },
          utilityMethods,
        });
        expect(pod.createPagesInNotion).toHaveBeenCalledTimes(1);
        expect(pod.convertMdToNotionBlock).toHaveBeenCalledTimes(1);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});
