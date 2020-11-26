import { NoteTestUtilsV4, TestPresetEntry } from "@dendronhq/common-test-utils";
import { VSCodeUtils } from "../../utils";
import { getActiveEditorBasename } from "../testUtils";

const ANCHOR = new TestPresetEntry({
  label: "anchor",
  preSetupHook: async ({ wsRoot, vaults }) => {
    const vault = vaults[0];
    await NoteTestUtilsV4.createNote({
      wsRoot,
      vault,
      fname: "alpha",
      body: [`# H1`, `# H2`, `# H3`, "", "Some Content"].join("\n"),
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

const ANCHOR_WITH_SPECIAL_CHARS = new TestPresetEntry({
  label: "anchor with special chars",
  preSetupHook: async ({ wsRoot, vaults }) => {
    const vault = vaults[0];
    const specialCharsHeader = `H3 &$#@`;
    await NoteTestUtilsV4.createNote({
      wsRoot,
      vault,
      fname: "alpha",
      body: [
        `# H1`,
        `# H2`,
        `# ${specialCharsHeader}`,
        "",
        "Some Content",
      ].join("\n"),
    });
    return { specialCharsHeader };
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

export const GOTO_NOTE_PRESETS = {
  ANCHOR,
  ANCHOR_WITH_SPECIAL_CHARS,
};
