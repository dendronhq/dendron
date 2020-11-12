import { TestPresetEntry } from "../../utils";
import ENGINE_SINGLE_TEST_PRESET from "./engine-single";

const INIT = {
  WITH_STUBS: new TestPresetEntry({
    label: "with stubs",
    before: ENGINE_SINGLE_TEST_PRESET.INIT.WITH_STUBS.before,
    results: async ({}: {}) => {
      return [];
    },
  }),
  results: ENGINE_SINGLE_TEST_PRESET.INIT.WITH_STUBS.results,
};

const ENGINE_MULTI_TEST_PRESET = {
  INIT,
};

export default ENGINE_MULTI_TEST_PRESET;
