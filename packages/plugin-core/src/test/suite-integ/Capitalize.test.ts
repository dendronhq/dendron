import { ENGINE_HOOKS } from '@dendronhq/engine-test-utils';
import { afterEach, beforeEach, describe } from 'mocha';
import sinon from 'sinon';
import { commands, Selection, TextEditor, window } from 'vscode';
import { CapitalizeCommand } from '../../commands/CapitalizeCommand';
import { DENDRON_COMMANDS } from "../../constants";
import { ExtensionProvider } from '../../ExtensionProvider';
import { WSUtils } from '../../WSUtils';
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

suite(`GIVEN ${DENDRON_COMMANDS.CAPITALIZE.key} command`, function () {
  describeMultiWS(
    "WHEN there is active document",
    { preSetupHook: ENGINE_HOOKS.setupBasic },
    () => {

      beforeEach(async () => {
        // Open a sample note
        const { engine } = ExtensionProvider.getDWorkspace();
        const note = engine.notes['foo'];
        await WSUtils.openNote(note);
      });

      afterEach(async () => {
        // Close the sample note
        await commands.executeCommand('workbench.action.closeActiveEditor');
      })

      describe("AND a text is selected", async () => {

        let editor: TextEditor;

        beforeEach(() => {
          // Select the note body
          editor = window.activeTextEditor!;  
          editor.selection = new Selection(7, 0, 7, 8);
        });

        test("THEN selected text should be capitalized", async () => {
          // Run the command
          const cmd = new CapitalizeCommand();
          await cmd.run();
          
          // Get the selected text
          const selectedText = editor.document.getText(editor.selection);
          // Assert that the selected text is capitalized
          expect(selectedText).toEqual("FOO BODY");
        })
      });

      describe("AND no text is selected", async () => {

        test("THEN running capitalize command should show a proper error message", async () => {

          const spy = sinon.spy(window, "showErrorMessage");
          
          // Run the command
          const cmd = new CapitalizeCommand();
          await cmd.run();

          // Assert that the error message showed up
          expect(spy.calledOnceWith("Please select a text to capitalize")).toEqual(true);
          spy.restore();
        })
      })
    }
  );
});