import { NodeTestUtilsV2, TestPresetEntry } from "@dendronhq/common-test-utils";
import { VSCodeUtils } from "../../utils";
import { getActiveEditorBasename } from "../testUtils";

export const GOTO_NOTE_PRESET = new TestPresetEntry({
  label: "basic",
  preSetupHook: async ({ vaults }) => {
    const vault = vaults[0];
    await NodeTestUtilsV2.createNote({
      vaultDir: vault.fsPath,
      noteProps: {
        fname: "alpha",
        body: [`# H1`, `# H2`, `# H3`, "", "Some Content"].join("\n"),
      },
    });
  },
  results: async () => {
    const selection = VSCodeUtils.getActiveTextEditor()?.selection;
    return [
      {
        actual: getActiveEditorBasename(),
        expected: "alpha.md",
      },
      {
        actual: selection?.start.line,
        expected: 9,
      },
      {
        actual: selection?.start.character,
        expected: 0,
      },
    ];
  },
});
