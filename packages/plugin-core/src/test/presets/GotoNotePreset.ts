import { NoteTestUtilsV4, TestPresetEntry } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { getActiveEditorBasename } from "../testUtils";
import { LocationTestUtils } from "../testUtilsv2";
import { Selection } from "vscode";

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

const LINK_TO_NOTE_IN_SAME_VAULT = new TestPresetEntry<{
  ext: IDendronExtension;
}>({
  label: "WHEN link to note in same vault",
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupLinks(opts);
  },

  beforeTestResults: async ({ ext }) => {
    const { engine } = ext.getDWorkspace();
    const note = (await engine.getNote("alpha")).data!;
    const editor = await new WSUtilsV2(ext).openNote(note);
    editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
      line: 7,
      char: 23,
    });
  },

  results: async () => {
    return [
      {
        actual: getActiveEditorBasename(),
        expected: "beta.md",
      },
    ];
  },
});

const LINK_IN_CODE_BLOCK = new TestPresetEntry<{
  ext: IDendronExtension;
}>({
  label: "WHEN link in code block",

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
    const note = (await engine.getNote("test.note")).data!;
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

const LINK_TO_NOTE_WITH_URI_HTTP = new TestPresetEntry<{
  ext: IDendronExtension;
}>({
  label: "WHEN uri is present",

  preSetupHook: async ({ wsRoot, vaults }) => {
    await NoteTestUtilsV4.createNote({
      fname: "alpha",
      vault: vaults[0],
      wsRoot,
      custom: {
        uri: "http://example.com",
      },
    });
    await NoteTestUtilsV4.createNote({
      fname: "beta",
      vault: vaults[0],
      wsRoot,
      body: "[[alpha]]",
    });
  },

  beforeTestResults: async ({ ext }) => {
    const { engine } = ext.getDWorkspace();
    const note = (await engine.getNote("beta")).data!;
    const editor = await new WSUtilsV2(ext).openNote(note);
    editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
      line: 7,
      char: 0,
    });
  },

  results: async () => {
    return [];
  },
});

const VALID_URL = new TestPresetEntry<{
  ext: IDendronExtension;
}>({
  label: "WHEN cursor is on a valid url",
  preSetupHook: async ({ wsRoot, vaults }) => {
    await NoteTestUtilsV4.createNote({
      fname: "test.note",
      vault: vaults[0],
      wsRoot,
      body: [
        "Here we have some example text to search for URLs within",
        "https://www.dendron.so/",
      ].join("\n"),
    });
  },
  beforeTestResults: async ({ ext }) => {
    const { engine } = ext.getDWorkspace();
    const note = (await engine.getNote("test.note")).data!;
    const editor = await new WSUtilsV2(ext).openNote(note);
    editor.selection = new Selection(8, 3, 8, 3);
  },
  results: async () => {
    return [];
  },
});

const PARTIAL_URL = new TestPresetEntry<{
  ext: IDendronExtension;
}>({
  label: "WHEN selection includes non URL string",
  preSetupHook: async ({ wsRoot, vaults }) => {
    await NoteTestUtilsV4.createNote({
      fname: "test.note",
      vault: vaults[0],
      wsRoot,
      body: [
        "URL with text around it",
        "check out [dendron](https://www.dendron.so/)",
      ].join("\n"),
    });
  },
  beforeTestResults: async ({ ext }) => {
    const { engine } = ext.getDWorkspace();
    const note = (await engine.getNote("test.note")).data!;
    const editor = await new WSUtilsV2(ext).openNote(note);
    editor.selection = new Selection(8, 15, 8, 25);
  },
  results: async () => {
    return [];
  },
});

const NO_LINK = new TestPresetEntry<{
  ext: IDendronExtension;
}>({
  label: "WHEN there is no valid link under the cursor",
  preSetupHook: async (opts) => ENGINE_HOOKS.setupBasic(opts),
  beforeTestResults: async ({ ext }) => {
    const { engine } = ext.getDWorkspace();
    const note = (await engine.getNote("foo")).data!;
    const editor = await new WSUtilsV2(ext).openNote(note);
    editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
      line: 8,
      char: 1,
    });
  },
  results: async () => {
    return [];
  },
});

export const GOTO_NOTE_PRESETS = {
  ANCHOR,
  ANCHOR_WITH_SPECIAL_CHARS,
  LINK_TO_NOTE_IN_SAME_VAULT,
  LINK_IN_CODE_BLOCK,
  LINK_TO_NOTE_WITH_URI_HTTP,
  VALID_URL,
  PARTIAL_URL,
  NO_LINK,
};
