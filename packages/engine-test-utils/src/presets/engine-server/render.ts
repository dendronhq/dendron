import { AssertUtils, TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "./utils";

const NOTES = {
  BASIC: new TestPresetEntryV4(
    async ({ engine }) => {
      const { data } = await engine.renderNote({
        id: "foo",
      });
      return [
        {
          actual: true,
          expected: await AssertUtils.assertInString({
            body: data!,
            match: ["<p>foo body</p>"],
          }),
          msg: "foo",
        },
      ];
    },
    {
      preSetupHook: async (opts) => {
        return ENGINE_HOOKS.setupBasic(opts);
      },
    }
  ),
};

export const ENGINE_RENDER_PRESETS = {
  NOTES,
};
