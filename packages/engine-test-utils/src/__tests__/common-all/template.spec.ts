import { NoteProps, TemplateUtils } from "@dendronhq/common-all";
import { TestNoteFactory } from "@dendronhq/common-test-utils";
import sinon from "sinon";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";

describe(`WHEN running applyTemplate tests`, () => {
  const noteFactory: TestNoteFactory = TestNoteFactory.defaultUnitTestFactory();
  let targetNote: NoteProps;
  const currentDate = new Date(2022, 0, 10);
  let clock: sinon.SinonFakeTimers;

  describe("WHEN handlebars enabled", () => {
    beforeEach(async () => {
      targetNote = await noteFactory.createForFName("new note");
      clock = sinon.useFakeTimers(currentDate);
    });
    afterEach(() => {
      sinon.restore();
      clock.restore();
    });

    describe("AND WHEN update one variable", () => {
      it("THEN render variable", async () => {
        await runEngineTestV5(
          async ({ engine }) => {
            const templateNote: NoteProps = engine.notes["foo"];
            templateNote.body = "hello {{fm.name}}";
            templateNote.custom.name = "james";
            TemplateUtils.applyTemplate({
              templateNote,
              targetNote,
              engine,
            });
            expect(targetNote.body).toEqual("hello james");
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
      });
    });

    describe("AND WHEN update one variable but value is not present", () => {
      it("THEN do not render variable", async () => {
        await runEngineTestV5(
          async ({ engine }) => {
            const templateNote: NoteProps = engine.notes["foo"];
            templateNote.body = "hello {{fm.name}}";
            TemplateUtils.applyTemplate({
              templateNote,
              targetNote,
              engine,
            });
            expect(targetNote.body).toEqual("hello ");
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

    describe("GIVEN template type is not a note", () => {
      beforeEach(async () => {
        targetNote = await noteFactory.createForFName("new note");
      });

      it("WHEN applying a template, THEN do nothing and return false ", async () => {
        await runEngineTestV5(
          async ({ engine }) => {
            const templateNote: NoteProps = engine.notes["foo"];
            templateNote.type = "schema";
            const resp = TemplateUtils.applyTemplate({
              templateNote,
              targetNote,
              engine,
            });
            expect(resp).toBeFalsy();
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
