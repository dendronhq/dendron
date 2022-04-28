import { NoteTestUtilsV4, TestPresetEntry } from "@dendronhq/common-test-utils";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { getActiveEditorBasename } from "../testUtils";
import { LocationTestUtils } from "../testUtilsv2";

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
    const specialCharsHeader = `H3 &$!@`;
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

const CODE_BLOCK_PRESET = new TestPresetEntry<{
  ext: IDendronExtension;
}>({
  label: "link in code block",

  preSetupHook: async ({ wsRoot, vaults }) => {
    await NoteTestUtilsV4.createNote({
      fname: "test.target",
      vault: vaults[0],
      wsRoot,
      body: "In aut veritatis odit tempora aut ipsa quo.",
    });
    await NoteTestUtilsV4.createNote({
      fname: "test.note",
      vault: vaults[0],
      wsRoot,
      body: [
        "```tsx",
        "const x = 1;",
        "// see [[test target|test.target]]",
        "const y = x + 1;",
        "```",
      ].join("\n"),
    });
  },

  beforeTestResults: async ({ ext }) => {
    const { engine } = ext.getDWorkspace();
    const note = engine.notes["test.note"];
    const editor = await new WSUtilsV2(ext).openNote(note);
    editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
      line: 9,
      char: 23,
    });
  },

  results: async () => {
    return [
      {
        actual: getActiveEditorBasename(),
        expected: "test.target.md",
      },
    ];
  },
});

export const GOTO_NOTE_PRESETS = {
  ANCHOR,
  ANCHOR_WITH_SPECIAL_CHARS,
  CODE_BLOCK_PRESET,
};
