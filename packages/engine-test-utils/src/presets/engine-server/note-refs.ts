import {
  TestPresetEntryV4,
  AssertUtils,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";

const WILDCARD_LINK_V4 = new TestPresetEntryV4(
  async ({}) => {
    // TODO: this isn't done
    return [];
  },
  {
    genTestResults: async ({ extra }) => {
      const { body } = extra;
      const out = await AssertUtils.assertInString({
        body,
        match: ["journal1", "journal2", "journal3"],
        nomatch: ["journal0"],
      });
      return [{ actual: out, expected: true }];
    },
    preSetupHook: async ({ wsRoot, vaults }) => {
      await NoteTestUtilsV4.createNote({
        vault: vaults[0],
        wsRoot,
        body: "journal0",
        fname: "journal.2020.07.01",
      });
      await NoteTestUtilsV4.createNote({
        vault: vaults[0],
        wsRoot,
        body: "journal1",
        fname: "journal.2020.08.01",
      });
      await NoteTestUtilsV4.createNote({
        vault: vaults[0],
        wsRoot,
        body: "journal2",
        fname: "journal.2020.08.02",
      });
      await NoteTestUtilsV4.createNote({
        vault: vaults[0],
        wsRoot,
        body: "journal3",
        fname: "journal.2020.08.03",
      });
      const note = await NoteTestUtilsV4.createNote({
        vault: vaults[0],
        wsRoot,
        props: {
          id: "id.journal",
        },
        body: "![[journal.2020.08.*]]",
        fname: "journal",
      });
      return { note };
    },
  }
);

const NOTE_REF_PRESET = {
  WILDCARD_LINK_V4,
};

export default NOTE_REF_PRESET;
