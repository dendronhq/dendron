import { VaultUtils } from "@dendronhq/common-all";
import { HTMLPublishPod } from "@dendronhq/pods-core";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";

describe("WHEN using html publish pod to publish note", () => {
  test("THEN generate correct HTML", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new HTMLPublishPod();
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
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });
});
