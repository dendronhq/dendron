import {
  NodeTestUtilsV2,
  NoteTestUtilsV3,
  TestPresetEntry,
} from "@dendronhq/common-test-utils";

const NOTES_SAME_VAULT = new TestPresetEntry({
  label: "basic",
  preSetupHook: async ({ vaults }) => {
    const vault = vaults[0];
    await NoteTestUtilsV3.createNote({
      fname: "alpha",
      vault,
      body: "[[beta]]",
    });
    await NoteTestUtilsV3.createNote({
      fname: "beta",
      vault,
      body: "[[alpha]]",
    });
  },
  postSetupHook: async () => {},
  results: async ({}: {}) => {
    return [];
  },
});

const NOTES_DIFF_VAULT = new TestPresetEntry({
  label: "basic",
  preSetupHook: async ({ vaults }) => {
    await NoteTestUtilsV3.createNote({
      fname: "alpha",
      vault: vaults[0],
      body: "[[beta]]",
    });
    await NoteTestUtilsV3.createNote({
      fname: "beta",
      vault: vaults[1],
      body: "[[alpha]]",
    });
  },
  postSetupHook: async () => {},
  results: async ({}: {}) => {
    return [];
  },
});

export const LINKS_PRESETS = {
  NOTES_SAME_VAULT,
  NOTES_DIFF_VAULT,
};
