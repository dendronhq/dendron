import { IntermediateDendronConfig, NoteProps } from "@dendronhq/common-all";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import sinon from "sinon";
import { TemplateApplyCommand } from "../../commands/TemplateApplyCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { expect } from "../testUtilsv2";
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

function createTemplateNote({ body, custom }: { body: string; custom?: any }) {
  const ext = ExtensionProvider.getExtension();
  const engine = ext.getEngine();
  const vault = engine.vaults[0];
  const wsRoot = engine.wsRoot;
  return NoteTestUtilsV4.createNote({
    body,
    fname: "templates.foo",
    vault,
    wsRoot,
    custom,
  });
}

async function runTemplateTest(templateNote: NoteProps) {
  const ext = ExtensionProvider.getExtension();
  const engine = ext.getEngine();
  const targetNote = engine.notes["foo"];
  await executeTemplateApply({ templateNote, targetNote });
  const editor = await new WSUtilsV2(ext).openNote(targetNote);
  const body = editor.document.getText();
  return { body };
}

const basicPreset = ENGINE_HOOKS.setupBasic;

const enableHB = (cfg: IntermediateDendronConfig) => {
  cfg.workspace.enableHandlebarTemplates = true;
  return cfg;
};

suite("TemplateApply", function () {
  describeMultiWS(
    "WHEN Template Apply run with regular template",
    {
      preSetupHook: basicPreset,
    },
    () => {
      test("THEN apply template", async () => {
        const templateNote = await createTemplateNote({
          body: "template text",
        });
        const { body } = await runTemplateTest(templateNote);
        expect(
          await AssertUtils.assertInString({ body, match: ["template text"] })
        ).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "WHEN Template Apply run with template with frontmatter",
    {
      preSetupHook: basicPreset,
      modConfigCb: enableHB,
    },
    () => {
      test("THEN apply frontmatter ", async () => {
        const templateNote = await createTemplateNote({
          body: "hello {{ fm.name }}",
          custom: { name: "john" },
        });
        const { body } = await runTemplateTest(templateNote);
        expect(
          await AssertUtils.assertInString({
            body,
            match: ["hello john", "name: john"],
          })
        ).toBeTruthy();
      });
    }
  );
});
