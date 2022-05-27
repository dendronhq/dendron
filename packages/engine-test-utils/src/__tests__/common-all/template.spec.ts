import { NoteProps } from "@dendronhq/common-all";
import { TemplateUtils } from "@dendronhq/common-server";
import { TestNoteFactory } from "@dendronhq/common-test-utils";
import sinon from "sinon";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";

describe(`WHEN running applyTemplate tests`, () => {
  const noteFactory: TestNoteFactory = TestNoteFactory.defaultUnitTestFactory();
  let targetNote: NoteProps;
  const currentDate = new Date(2022, 0, 10);
  let clock: sinon.SinonFakeTimers;

  async function setupTemplateTest(
    opts: {
      templateNoteBody: string;
      fm: any;
    },
    cb: ({ targetNote }: { targetNote: NoteProps }) => void
  ) {
    const targetNote = await noteFactory.createForFName("new-note");

    await runEngineTestV5(
      async ({ engine }) => {
        const templateNote: NoteProps = engine.notes["foo"];
        templateNote.body = opts.templateNoteBody;
        templateNote.custom = opts.fm;
        TemplateUtils.applyTemplate({
          templateNote,
          targetNote,
          engine,
        });
        cb({ targetNote });
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        modConfigCb: (cfg) => {
          cfg.workspace.enableHandlebarTemplates = true;
          return cfg;
        },
      }
    );
  }

  describe("WHEN handlebars enabled", () => {
    beforeEach(async () => {
      targetNote = await noteFactory.createForFName("new note");
      clock = sinon.useFakeTimers(currentDate);
    });
    afterEach(() => {
      sinon.restore();
      clock.restore();
    });

    const testTemplateNoteBody = "hello {{fm.name}}";
    const testFM = { name: "james" };

    describe("AND WHEN update one variable", () => {
      it("THEN render variable", async () => {
        setupTemplateTest(
          { templateNoteBody: testTemplateNoteBody, fm: testFM },
          ({ targetNote }) => {
            expect(targetNote.body).toEqual("hello james");
          }
        );
      });
    });

    describe("AND WHEN update one variable but value is not present", () => {
      it("THEN do not render variable", async () => {
        setupTemplateTest(
          { templateNoteBody: testTemplateNoteBody, fm: {} },
          ({ targetNote }) => {
            expect(targetNote.body).toEqual("hello ");
          }
        );
      });
    });

    const templateBodyWithConditional = [
      "{{#if fm.name}}",
      "hello {{fm.name}}",
      "{{else}}",
      "No name",
      "{{/if}}",
    ].join("\n");

    describe("AND WHEN conditional is present AND is true", () => {
      it("THEN render conditional", async () => {
        setupTemplateTest(
          {
            templateNoteBody: templateBodyWithConditional,
            fm: testFM,
          },
          ({ targetNote }) => {
            expect(targetNote.body).toEqual("hello james\n");
          }
        );
      });
    });

    describe("AND WHEN conditional is present AND is false", () => {
      it("THEN render else clause", async () => {
        setupTemplateTest(
          {
            templateNoteBody: templateBodyWithConditional,
            fm: {},
          },
          ({ targetNote }) => {
            expect(targetNote.body).toEqual("No name\n");
          }
        );
      });
    });

    describe("AND WHEN template uses default context value", () => {
      it("THEN render default context value", () => {
        setupTemplateTest(
          {
            templateNoteBody: "[[{{FNAME}}.child]]",
            fm: {},
          },
          ({ targetNote }) => {
            expect(targetNote.body).toEqual("[[new-note.child]]");
          }
        );
      });
    });

    describe("AND use escaped brackets", () => {
      it("THEN render raw values", () => {
        setupTemplateTest(
          {
            templateNoteBody: "\\{{ fm.name }}",
            fm: testFM,
          },
          ({ targetNote }) => {
            expect(targetNote.body).toEqual("{{ fm.name }}");
          }
        );
      });
    });
  });

  describe("WHEN non-handlebars", () => {
    describe(`GIVEN current note's body is empty`, () => {
      beforeEach(async () => {
        targetNote = await noteFactory.createForFName("new note");
        clock = sinon.useFakeTimers(currentDate);
      });
      afterEach(() => {
        sinon.restore();
        clock.restore();
      });

      it("WHEN applying a template, THEN replace note's body with template's body", async () => {
        await runEngineTestV5(
          async ({ engine }) => {
            const templateNote: NoteProps = engine.notes["foo"];
            const resp = TemplateUtils.applyTemplate({
              templateNote,
              targetNote,
              engine,
            });
            expect(resp).toBeTruthy();
            expect(targetNote.body).toEqual(engine.notes["foo"].body);
          },
          {
            expect,
            preSetupHook: ENGINE_HOOKS.setupSchemaPreseet,
          }
        );
      });

      it("WHEN applying a template with date variables, THEN replace note's body with template's body and with proper date substitution", async () => {
        await runEngineTestV5(
          async ({ engine }) => {
            const dateTemplate: NoteProps = engine.notes["date-variables"];
            const resp = TemplateUtils.applyTemplate({
              templateNote: dateTemplate,
              targetNote,
              engine,
            });

            expect(resp).toBeTruthy();
            expect(targetNote.body).not.toEqual(
              engine.notes["date-variables"].body
            );
            expect(targetNote.body.trim()).toEqual(
              `Today is 2022.01.10` +
                "\n" +
                "It is week 02 of the year" +
                "\n" +
                `This link goes to [[daily.journal.2022.01.10]]` +
                "\n" +
                `{{ 1 + 1 }} should not be evalated to 2`
            );
          },
          {
            expect,
            preSetupHook: ENGINE_HOOKS.setupRefs,
          }
        );
      });

      it("WHEN applying a template with fm variables, THEN replace note's body with template's body without errors", async () => {
        await runEngineTestV5(
          async ({ engine }) => {
            const fmTemplate: NoteProps = engine.notes["fm-variables"];
            const resp = TemplateUtils.applyTemplate({
              templateNote: fmTemplate,
              targetNote,
              engine,
            });

            expect(resp).toBeTruthy();
            expect(targetNote.body).toEqual(engine.notes["fm-variables"].body);
            expect(targetNote.body.trim()).toEqual(`Title is {{ fm.title }}`);
          },
          {
            expect,
            preSetupHook: ENGINE_HOOKS.setupRefs,
          }
        );
      });
    });

    describe(`GIVEN current note's body is not empty`, () => {
      const noteBody = "test test";

      beforeEach(async () => {
        targetNote = await noteFactory.createForFName("new note");
        targetNote.body = noteBody;
      });

      it("WHEN applying a template, THEN append note's body with a \\n + template's body", async () => {
        await runEngineTestV5(
          async ({ engine }) => {
            const templateNote: NoteProps = engine.notes["foo"];
            const resp = TemplateUtils.applyTemplate({
              templateNote,
              targetNote,
              engine,
            });
            expect(resp).toBeTruthy();
            expect(targetNote.body).toEqual(
              noteBody + "\n" + engine.notes["foo"].body
            );
          },
          {
            expect,
            preSetupHook: ENGINE_HOOKS.setupSchemaPreseet,
          }
        );
      });
    });
  });
});
