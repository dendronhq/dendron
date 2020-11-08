import { DVault } from "@dendronhq/common-all";
import { FileTestUtils, NodeTestUtilsV2 } from "../..";
import { AssertUtils, TestPresetEntry } from "../../utils";

const WILDCARD_LINK = new TestPresetEntry({
  label: "wildcard link",
  before: async ({ vaults }: { vaults: DVault[] }) => {
    await FileTestUtils.createFiles(vaults[0].fsPath, [
      {
        path: "journal.2020.07.01.md",
        body: "journal0",
      },
      {
        path: "journal.2020.08.01.md",
        body: "journal1",
      },
      {
        path: "journal.2020.08.02.md",
        body: "journal2",
      },
      {
        path: "journal.2020.08.03.md",
        body: "journal3",
      },
    ]);
    const note = await NodeTestUtilsV2.createNote({
      vaultDir: vaults[0].fsPath,
      noteProps: {
        id: "id.journal",
        body: "((ref:[[journal.2020.08.*]]))",
        fname: "journal",
      },
    });
    return { note };
  },
  results: async ({ body }: { body: string }) => {
    const out = await AssertUtils.assertInString({
      body,
      match: ["journal1", "journal2", "journal3"],
      nomatch: ["journal0"],
    });
    return [{ actual: out, expected: true }];
  },
});

const NOTE_REF_PRESET = {
  WILDCARD_LINK,
};

export default NOTE_REF_PRESET;
