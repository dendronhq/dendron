import { vault2Path } from "@dendronhq/common-server";
import { FileTestUtils } from "../..";
import { NoteTestUtilsV4 } from "../../noteUtils";
import { AssertUtils } from "../../utils";
import { TestPresetEntryV4 } from "../../utilsv2";

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
      const vpath = vault2Path({ wsRoot, vault: vaults[0] });
      await FileTestUtils.createFiles(vpath, [
        {
          path: "journal.2020.07.01.md",
          body: "journal0",
        },
        {
          path: "journal.2020.08.01.md",
          body: "journal1",
        },
        {
          path: "journal.2020.08.03.md",
          body: "journal3",
        },
        {
          path: "journal.2020.08.02.md",
          body: "journal2",
        },
      ]);
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
