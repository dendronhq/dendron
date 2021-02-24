import { VaultUtils } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import { MarkdownPublishPod } from "@dendronhq/pods-core";
import { runEngineTestV5 } from "../../engine";

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
        expect(resp).toEqual("foo body");
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });
});
