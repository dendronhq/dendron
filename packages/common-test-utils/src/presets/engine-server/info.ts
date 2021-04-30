import _ from "lodash";
import { TestPresetEntryV4 } from "../../utilsv2";
import { NOTE_PRESETS_V4 } from "../notes";

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
