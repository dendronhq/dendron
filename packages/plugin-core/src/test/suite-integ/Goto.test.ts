import { runMochaHarness } from "@dendronhq/common-test-utils";
import sinon from "sinon";
import * as vscode from "vscode";
import { GotoCommand } from "../../commands/Goto";
import { DENDRON_COMMANDS } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { GOTO_NOTE_PRESETS } from "../presets/GotoNotePreset";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

const executeGotoCmd = () => {
  return vscode.commands.executeCommand(DENDRON_COMMANDS.GOTO.key);
};

suite("GotoNote", function () {
  describeMultiWS(
    GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.label,
    {
      preSetupHook: GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.preSetupHook,
    },
    () => {
      test("THEN goto note", async () => {
        const ext = ExtensionProvider.getExtension();
        await GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.beforeTestResults({ ext });
        await executeGotoCmd();
        await runMochaHarness(GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.results);
      });
    }
  );

  describeMultiWS(
    GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.label,
    {
      preSetupHook: GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.preSetupHook,
    },
    () => {
      test("THEN goto note", async () => {
        const ext = ExtensionProvider.getExtension();
        await GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.beforeTestResults({
          ext,
        });
        await executeGotoCmd();
        await runMochaHarness(
          GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.results
        );
      });
    }
  );

  describeMultiWS(
    "WHEN link to note with uri http",
    {
      preSetupHook: GOTO_NOTE_PRESETS.LINK_TO_NOTE_WITH_URI_HTTP.preSetupHook,
    },
    () => {
      test("THEN goto note", async () => {
        const ext = ExtensionProvider.getExtension();
        await GOTO_NOTE_PRESETS.LINK_TO_NOTE_WITH_URI_HTTP.beforeTestResults({
          ext,
        });
        const cmd = new GotoCommand(ext);
        const openLinkMethod = sinon.stub(cmd, "openLink" as keyof GotoCommand);
        await cmd.execute();
        expect(openLinkMethod.calledOnce).toBeTruthy();
      });
    }
  );
});
