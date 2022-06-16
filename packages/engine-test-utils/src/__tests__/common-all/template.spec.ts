import { IntermediateDendronConfig, NoteProps } from "@dendronhq/common-all";
import { TemplateUtils } from "@dendronhq/common-server";
import { AssertUtils, TestNoteFactory } from "@dendronhq/common-test-utils";
import sinon from "sinon";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";

async function expectStringMatch(note: NoteProps, matchTxt: string) {
  expect(
    await AssertUtils.assertInString({ body: note.body, match: [matchTxt] })
  ).toBeTruthy();
}

describe(`WHEN running applyTemplate tests`, () => {
  const noteFactory: TestNoteFactory = TestNoteFactory.defaultUnitTestFactory();
  let targetNote: NoteProps;
  const currentDate = new Date(2022, 0, 10);
  let clock: sinon.SinonFakeTimers;

  async function setupTemplateTest(
    opts: {
      templateNoteBody: string;
      templateNoteFname?: string;
      fm: any;
    },
    cb: ({ targetNote }: { targetNote: NoteProps }) => void
  ) {
    const targetNote = await noteFactory.createForFName(
      opts.templateNoteFname || "new-note"
    );

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
        await cb({ targetNote });
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

  describe("WHEN using handlebar helpers", () => {
    beforeEach(async () => {
      targetNote = await noteFactory.createForFName("new note");
      clock = sinon.useFakeTimers(currentDate);
    });
    afterEach(() => {
      sinon.restore();
    });
    const eqHelper = "{{ eq fm.arg1 fm.arg2 }}";
    const fnameToDateHelper = "{{ fnameToDate }}";
    const getDayOfWeekHelper = "{{ getDayOfWeek (fnameToDate) }}";

    describe("AND WHEN track helper usage", () => {
      describe("AND WHEN comparing equal args", () => {
        it("THEN show true", async () => {
          const templateNote = await noteFactory.createForFName("foo");
          templateNote.body = eqHelper;
          expect(
            TemplateUtils.genTrackPayload(templateNote).helperStats
          ).toEqual({
            fnameToDate: 0,
            eq: 1,
            getDayOfWeek: 0,
          });
        });
      });

      describe("AND WHEN comparing all args", () => {
        it("THEN show true", async () => {
          const templateNote = await noteFactory.createForFName("foo");
          templateNote.body = [
            eqHelper,
            fnameToDateHelper,
            getDayOfWeekHelper,
          ].join("\n");
          expect(
            TemplateUtils.genTrackPayload(templateNote).helperStats
          ).toEqual({
            fnameToDate: 1,
            eq: 1,
            getDayOfWeek: 1,
          });
        });
      });
    });

    describe("AND WHEN using eq helper", () => {
      const testTemplateNoteBody = "{{ eq fm.arg1 fm.arg2 }}";
      describe("AND WHEN comparing equal args", () => {
        it("THEN show true", async () => {
          await setupTemplateTest(
            {
              templateNoteBody: testTemplateNoteBody,
              fm: { arg1: 1, arg2: 1 },
            },
            ({ targetNote }) => {
              expect(targetNote.body).toEqual("true");
            }
          );
        });
      });

      describe("AND WHEN comparing not equal args", () => {
        it("THEN show false", async () => {
          await setupTemplateTest(
            {
              templateNoteBody: testTemplateNoteBody,
              fm: { arg1: 1, arg2: 2 },
            },
            ({ targetNote }) => {
              expect(targetNote.body).toEqual("false");
            }
          );
        });
      });
    });

    describe("WHEN using match helper", () => {
      const testTemplateNoteBody = `{{ match FNAME "\\d{4}.\\d{2}.\\d{2}" }}`;

      describe("AND WHEN match against date based fname", () => {
        it("THEN extract date", async () => {
          await setupTemplateTest(
            {
              templateNoteBody: testTemplateNoteBody,
              templateNoteFname: "daily.journal.2022.01.10",
              fm: {},
            },
            async ({ targetNote }) => {
              await expectStringMatch(targetNote, "2022.01.10");
            }
          );
        });
      });

      describe("AND WHEN match fail", () => {
        it("THEN return false", async () => {
          const testTemplateNoteBody = `{{ match FNAME "hello" }}`;
          await setupTemplateTest(
            {
              templateNoteBody: testTemplateNoteBody,
              templateNoteFname: "daily.journal.2022.01.10",
              fm: {},
            },
            async ({ targetNote }) => {
              await expectStringMatch(targetNote, "false");
            }
          );
        });
      });
    });

    describe("AND WHEN using fnameToDate helper", () => {
      const testTemplateNoteBody = "{{ fnameToDate }}";

      describe("AND WHEN no args and date in fname", () => {
        it("THEN extract date", async () => {
          await setupTemplateTest(
            {
              templateNoteBody: testTemplateNoteBody,
              templateNoteFname: "daily.journal.2022.01.10",
              fm: {},
            },
            async ({ targetNote }) => {
              await expectStringMatch(targetNote, "Mon Jan 10 2022 00:00:00");
            }
          );
        });
      });

      describe("AND WHEN no args and no date in fname", () => {
        it("THEN throw error", async () => {
          await setupTemplateTest(
            {
              templateNoteBody: testTemplateNoteBody,
              fm: {},
            },
            async ({ targetNote }) => {
              await expectStringMatch(
                targetNote,
                "ERROR: no match found for {year}, {month}, or {day}"
              );
            }
          );
        });
      });

      describe("AND WHEN custom args", () => {
        it("THEN extract date", async () => {
          await setupTemplateTest(
            {
              templateNoteBody: `{{ fnameToDate '(?<year>[\\d]{4})-(?<month>[\\d]{2})-(?<day>[\\d]{2})' }}`,
              templateNoteFname: "daily.journal.2022-01-10",
              fm: {},
            },
            async ({ targetNote }) => {
              await expectStringMatch(targetNote, "Mon Jan 10 2022 00:00:00");
            }
          );
        });
      });

      describe("AND WHEN using getDayOfWeek helper", () => {
        const testTemplateNoteBody = "{{ getDayOfWeek (fnameToDate) }}";
        it("THEN get day of week", async () => {
          await setupTemplateTest(
            {
              templateNoteBody: testTemplateNoteBody,
              templateNoteFname: "daily.journal.2022.01.10",
              fm: {},
            },
            async ({ targetNote }) => {
              await expectStringMatch(targetNote, "1");
            }
          );
        });
      });
    });
  });

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
    const modConfigCb = (cfg: IntermediateDendronConfig) => {
      cfg.workspace.enableHandlebarTemplates = false;
      return cfg;
    };
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
            modConfigCb,
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
            modConfigCb,
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
            modConfigCb,
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
            modConfigCb,
          }
        );
      });
    });
  });
});
