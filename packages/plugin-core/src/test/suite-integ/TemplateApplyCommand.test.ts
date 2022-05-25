import { NoteProps } from "@dendronhq/common-all";
import { expect } from "../testUtilsv2";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import sinon from "sinon";
import { TemplateApplyCommand } from "../../commands/TemplateApplyCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { describeMultiWS } from "../testUtilsV3";

async function executeTemplateApply({
  templateNote,
  targetNote,
}: {
  templateNote: NoteProps;
  targetNote: NoteProps;
}) {
  const cmd = new TemplateApplyCommand();
  const stub = sinon.stub(cmd, "gatherInputs").returns(
    Promise.resolve({
      templateNote,
      targetNote,
    })
  );
  await cmd.run();
  return {
    stub,
    templateNote,
  };
}

const basicPreset = ENGINE_HOOKS.setupBasic;

suite("TemplateApply", function () {
  describeMultiWS(
    "WHEN Template Apply run with regular template",
    {
      preSetupHook: basicPreset,
    },
    () => {
      test("THEN apply template", async () => {
        const ext = ExtensionProvider.getExtension();
        const engine = ext.getEngine();
        const targetNote = engine.notes["foo"];
        const vault = engine.vaults[0];
        const wsRoot = engine.wsRoot;
        const templateNote = await NoteTestUtilsV4.createNote({
          body: "template text",
          fname: "templates.foo",
          vault,
          wsRoot,
        });
        await executeTemplateApply({ templateNote, targetNote });
        const editor = await new WSUtilsV2(ext).openNote(targetNote);
        const body = editor.document.getText();
        expect(
          await AssertUtils.assertInString({ body, match: ["template text"] })
        ).toBeTruthy();
      });
    }
  );
});
