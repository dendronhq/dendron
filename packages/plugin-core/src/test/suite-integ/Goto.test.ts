import { runMochaHarness } from "@dendronhq/common-test-utils";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { GOTO_NOTE_PRESETS } from "../presets/GotoNotePreset";
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
        const ext = ExtensionProvider.getExtension();
        await GOTO_NOTE_PRESETS.CODE_BLOCK_PRESET.beforeTestResults({ ext });
        await executeGotoCmd();
        await runMochaHarness(GOTO_NOTE_PRESETS.CODE_BLOCK_PRESET.results);
      });
    }
  );
});
