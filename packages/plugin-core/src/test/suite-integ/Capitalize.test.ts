import { ENGINE_HOOKS } from '@dendronhq/engine-test-utils';
import { Selection, window } from 'vscode';
import { CapitalizeCommand } from '../../commands/CapitalizeCommand';
import { DENDRON_COMMANDS } from "../../constants";
import { ExtensionProvider } from '../../ExtensionProvider';
import { WSUtils } from '../../WSUtils';
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

suite(`GIVEN ${DENDRON_COMMANDS.CAPITALIZE.key} command`, function () {
  describeMultiWS(
    "WHEN command is run",
    { preSetupHook: ENGINE_HOOKS.setupBasic },
    () => {

      test("THEN selected text should be capitalized", async () => {
        // Open a sample note
        const { engine } = ExtensionProvider.getDWorkspace();
        const note = engine.notes['foo'];
        await WSUtils.openNote(note);

        // Select the note body
        const editor = window.activeTextEditor!;  
        editor.selection = new Selection(7, 0, 7, 8);

        // Run the command
        const cmd = new CapitalizeCommand();
        await cmd.run();
        
        // Get the selected text
        const selectedText = editor.document.getText(editor.selection);
        // Assert that the selected text is capitalized
        expect(selectedText).toEqual("FOO BODY");
      })
      
    }
  );
});