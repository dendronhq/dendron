import { NoteProps } from "@dendronhq/common-all";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import sinon from "sinon";
import { ApplyTemplateCommand } from "../../commands/ApplyTemplateCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { expect } from "../testUtilsv2";
import { describeMultiWS, describeSingleWS } from "../testUtilsV3";

// these tests can run longer than the default 2s timeout;
const timeout = 5e3;

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
  const resp = await cmd.run();
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

async function runTemplateTest({
  templateNote,
  targetNote: _targetNote,
}: {
  templateNote: NoteProps;
  targetNote?: NoteProps;
}) {
  const ext = ExtensionProvider.getExtension();
  const engine = ext.getEngine();
  const targetNote = _targetNote || (await engine.getNote("foo")).data!;
  // note needs to be open, otherwise, command will throw an error
  await WSUtilsV2.instance().openNote(targetNote);
  const { updatedTargetNote } = await executeTemplateApply({
    templateNote,
    targetNote,
  });
  return { updatedTargetNote, body: updatedTargetNote.body };
}

const basicPreset = ENGINE_HOOKS.setupBasic;

suite("ApplyTemplate", function () {
  describeMultiWS(
    "WHEN ApplyTemplate run with regular template",
    {
      preSetupHook: basicPreset,
      timeout: 1e4,
    },
    () => {
      test("THEN apply template", async () => {
        const templateNote = await createTemplateNote({
          body: "template text",
        });
        const { body } = await runTemplateTest({ templateNote });
        expect(
          await AssertUtils.assertInString({ body, match: ["template text"] })
        ).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "WHEN ApplyTemplate run with note with no body",
    {
      preSetupHook: basicPreset,
      timeout: 1e6,
    },
    () => {
      test("THEN apply template", async () => {
        const templateNote = await createTemplateNote({
          body: "template text",
        });
        const { vaults, wsRoot } = ExtensionProvider.getEngine();
        const targetNote = await NoteTestUtilsV4.createNote({
          fname: "beta",
          body: "",
          vault: vaults[0],
          wsRoot,
        });
        const { body } = await runTemplateTest({ templateNote, targetNote });

        expect(
          await AssertUtils.assertInString({
            body,
            match: ["template text"],
          })
        ).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "WHEN ApplyTemplate run with template with frontmatter",
    {
      preSetupHook: basicPreset,
      timeout,
    },
    () => {
      test("THEN apply frontmatter ", async () => {
        const templateNote = await createTemplateNote({
          body: "hello {{ fm.name }}",
          custom: { name: "john" },
        });
        const { body, updatedTargetNote } = await runTemplateTest({
          templateNote,
        });
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

  describeSingleWS(
    "WHEN the target note already contains a template variable in the frontmatter",
    {},
    () => {
      test("THEN the existing variable value in the target note should be used", async () => {
        const ext = ExtensionProvider.getExtension();
        const engine = ext.getEngine();
        const vault = engine.vaults[0];
        const wsRoot = engine.wsRoot;

        const targetNote = await NoteTestUtilsV4.createNote({
          wsRoot,
          vault,
          fname: "target-note",
          custom: { foo: "original value" },
        });

        const templateNote = await createTemplateNote({
          body: "{{ fm.foo }}",
          custom: { foo: "template value" },
        });

        const { body, updatedTargetNote } = await runTemplateTest({
          targetNote,
          templateNote,
        });

        expect(updatedTargetNote.custom?.foo).toEqual("original value");
        expect(
          await AssertUtils.assertInString({
            body,
            match: ["original value"],
          })
        ).toBeTruthy();
      });
    }
  );
});
