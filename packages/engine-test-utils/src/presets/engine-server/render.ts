import { AssertUtils, NoteTestUtilsV4, TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import { checkString } from "../../utils";
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
  EMPTY_NOTE: new TestPresetEntryV4(
    async ({ engine }) => {
      const { data } = await engine.renderNote({
        id: "empty",
      });
      expect(data).toMatchSnapshot();
      return [
        {
          actual: true,
          expected: checkString(data!, ""),
          msg: "empty string",
        },
      ];
    },
    {
      preSetupHook: async (opts) => {
        return NoteTestUtilsV4.createNote({...opts, fname: "empty", vault: opts.vaults[0]});
      },
    }
  ),
};

export const ENGINE_RENDER_PRESETS = {
  NOTES,
};
