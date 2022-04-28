import { runMochaHarness } from "@dendronhq/common-test-utils";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { GOTO_NOTE_PRESETS } from "../presets/GotoNotePreset";
import { LocationTestUtils } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

const executeGotoCmd = () => {
  return vscode.commands.executeCommand(DENDRON_COMMANDS.GOTO.key);
};

suite("GotoNote", function () {
  describeMultiWS(
    "WHEN pass in note",
    {
      preSetupHook: GOTO_NOTE_PRESETS.CODE_BLOCK_PRESET.preSetupHook,
    },
    () => {
      test("THEN goto note", async () => {
        const { engine } = ExtensionProvider.getDWorkspace();
        const note = engine.notes["test.note"];
        const ext = ExtensionProvider.getExtension();
        const editor = await new WSUtilsV2(ext).openNote(note);
        editor.selection = LocationTestUtils.getPresetWikiLinkSelection({
          line: 9,
          char: 23,
        });
        await executeGotoCmd();
        await runMochaHarness(GOTO_NOTE_PRESETS.CODE_BLOCK_PRESET.results);
      });
    }
  );
});
