import { IntermediateDendronConfig, NoteProps } from "@dendronhq/common-all";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import sinon from "sinon";
import { ApplyTemplateCommand } from "../../commands/ApplyTemplateCommand";
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
  const cmd = new ApplyTemplateCommand();
  const stub = sinon.stub(cmd, "gatherInputs").returns(
    Promise.resolve({
      templateNote,
      targetNote,
    })
  );
  console.log({ bond: cmd.BOND });
  console.log({
    templateNote: JSON.stringify(templateNote),
    targetNote: JSON.stringify(targetNote),
  });
  const resp = await cmd.run();
  console.log({ resp: JSON.stringify(resp) });
  const updatedTargetNote = resp?.updatedTargetNote as NoteProps;
  return {
    stub,
    templateNote,
    updatedTargetNote,
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
  // note needs to be open, otherwise, command will throw an error
  await WSUtilsV2.instance().openNote(targetNote);
  const { updatedTargetNote } = await executeTemplateApply({
    templateNote,
    targetNote,
  });
  return { updatedTargetNote, body: updatedTargetNote.body };
}

const basicPreset = ENGINE_HOOKS.setupBasic;

const enableHB = (cfg: IntermediateDendronConfig) => {
  cfg.workspace.enableHandlebarTemplates = true;
  return cfg;
};

suite("ApplyTemplate", function () {
  describeMultiWS(
    "WHEN ApplyTemplate run with regular template",
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
    "WHEN ApplyTemplate run with template with frontmatter",
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
        const { body, updatedTargetNote } = await runTemplateTest(templateNote);
        expect(updatedTargetNote.custom?.name).toEqual("john");
        expect(
          await AssertUtils.assertInString({
            body,
            match: ["hello john"],
          })
        ).toBeTruthy();
      });
    }
  );
});
