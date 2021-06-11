import {
  TestPresetEntryV4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import _ from "lodash";

const NOTES = {
  BASIC: new TestPresetEntryV4(
    async ({ engine }) => {
      const info = await engine.info();
      if (info.error) {
        throw Error();
      }
      return [
        {
          actual: _.isEmpty(info.data!.version),
          expected: false,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NOTE_PRESETS_V4.NOTE_SIMPLE.create({ wsRoot, vault: vaults[0] });
      },
    }
  ),
};

export const ENGINE_INFO_PRESETS = {
  NOTES,
};
