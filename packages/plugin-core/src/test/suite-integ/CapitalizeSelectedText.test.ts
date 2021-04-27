import { ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import _ from "lodash";
import { ExtensionContext, Position, Selection } from "vscode";
import { CapitalizeSelectedTextCommand } from "../../commands/CapitalizeSelectedText";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("CapitalizeSelectedText", function () {
  let ctx: ExtensionContext;

  ctx = setupBeforeAfter(this, {});

  test("with no selections", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ vaults }) => {
        const vault = vaults[0];
        const fname = "foo";

        const editor = await VSCodeUtils.openNoteByPath({ vault, fname });

        const lowercaseText = "undercase text";

        const start = new Position(8, 0);
        const end = new Position(8, lowercaseText.length);
        const selection = new Selection(start, end);

        await editor.edit((editBuilder) => {
          editBuilder.insert(start, lowercaseText);
        });

        await new CapitalizeSelectedTextCommand().run();

        const changedText = editor.document.getText(selection);

        expect(changedText).toEqual(lowercaseText);
        done();
      },
    });
  });

  test("with one selection", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ vaults }) => {
        const vault = vaults[0];
        const fname = "foo";

        const editor = await VSCodeUtils.openNoteByPath({ vault, fname });

        const lowercaseText = "undercase text";
        const uppercaseText = "UNDERCASE TEXT";

        const start = new Position(8, 0);
        const end = new Position(8, lowercaseText.length);
        const selection = new Selection(start, end);

        await editor.edit((editBuilder) => {
          editBuilder.insert(start, lowercaseText);
        });

        editor.selection = selection;

        await new CapitalizeSelectedTextCommand().run();

        const changedText = editor.document.getText(selection);

        expect(changedText).toEqual(uppercaseText);
        done();
      },
    });
  });

  test("with multiple selections", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ vaults }) => {
        const vault = vaults[0];
        const fname = "foo";

        const editor = await VSCodeUtils.openNoteByPath({ vault, fname });

        const lowercaseText = "undercase text";
        const uppercaseText = "UNDERCASE TEXT";

        const positions = [
          [8, 0],
          [9, 0],
          [10, 0],
        ];
        const selections = positions.map((position) => {
          const start = new Position(position[0], position[1]);
          const end = new Position(
            position[0],
            position[1] + lowercaseText.length
          );
          return new Selection(start, end);
        });

        await editor.edit((editBuilder) => {
          selections.forEach((selection) => {
            editBuilder.insert(selection.start, lowercaseText + "\n");
          });
        });

        editor.selections = selections;

        await new CapitalizeSelectedTextCommand().run();

        selections.forEach((selection) => {
          const changedText = editor.document.getText(selection);

          expect(changedText).toEqual(uppercaseText);
        });
        done();
      },
    });
  });
});
