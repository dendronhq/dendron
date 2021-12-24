import {
  NoteUtils,
  SchemaUtils,
  DVault,
  SchemaOpts,
  NoteProps,
  SchemaTemplate,
  Time,
} from "@dendronhq/common-all";
import { NoteTestUtilsV4, TestNoteFactory } from "@dendronhq/common-test-utils";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";

describe(`NoteUtils tests:`, () => {
  describe(`genSchemaDesc tests`, () => {
    const vault = { fsPath: "/tmp/ws/vault1" };
    const SCHEMA_ID = "id-1";

    async function testGenSchemaDesc(
      schemaCreateOpts: SchemaOpts & { vault: DVault },
      expectedDescription: string
    ) {
      const schema = SchemaUtils.createFromSchemaOpts(schemaCreateOpts);

      const wsRoot = "/tmp/ws/";
      const schemaModuleProps = await NoteTestUtilsV4.createSchema({
        fname: "/tmp/fname1",
        vault,
        wsRoot,
        noWrite: true,
      });
      schemaModuleProps.schemas[SCHEMA_ID] = schema;

      const note = await NoteTestUtilsV4.createNote({
        vault,
        wsRoot,
        noWrite: true,
        fname: "f1",
        props: {
          schema: {
            schemaId: schema.id,
            moduleId: "irrelevant",
          },
        },
      });

      const desc = NoteUtils.genSchemaDesc(note, schemaModuleProps);
      expect(desc).toEqual(expectedDescription);
    }

    it(`WHEN id is auto generated THEN use the pattern.`, async () => {
      await testGenSchemaDesc(
        {
          fname: "hi",
          id: SCHEMA_ID,
          data: { pattern: "pattern-val", isIdAutoGenerated: true },
          vault,
        },
        "F1 $(repo) /tmp/fname1 $(breadcrumb-separator) pattern-val"
      );
    });

    it(`WHEN id is auto generated AND title is different than id then use title`, async () => {
      await testGenSchemaDesc(
        {
          fname: "hi",
          title: "title-val",
          id: SCHEMA_ID,
          data: { pattern: "pattern-val", isIdAutoGenerated: true },
          vault,
        },
        "F1 $(repo) /tmp/fname1 $(breadcrumb-separator) title-val"
      );
    });

    it(`WHEN id is not auto generated AND title is equal to id THEN use title.`, async () => {
      await testGenSchemaDesc(
        {
          fname: "hi",
          title: SCHEMA_ID,
          id: SCHEMA_ID,
          data: { pattern: "pattern-val" },
          vault,
        },
        `F1 $(repo) /tmp/fname1 $(breadcrumb-separator) ${SCHEMA_ID}`
      );
    });

    it(`WHEN id is not auto generated AND title is omitted THEN use id.`, async () => {
      await testGenSchemaDesc(
        {
          fname: "hi",
          title: undefined,
          id: SCHEMA_ID,
          data: { pattern: "pattern-val" },
          vault,
        },
        `F1 $(repo) /tmp/fname1 $(breadcrumb-separator) ${SCHEMA_ID}`
      );
    });
  });
});

describe(`SchemaUtil tests:`, () => {
  describe(`WHEN running applyTemplate tests`, () => {
    const noteFactory: TestNoteFactory =
      TestNoteFactory.defaultUnitTestFactory();
    let note: NoteProps;
    const template: SchemaTemplate = { id: "foo", type: "note" };

    describe(`GIVEN current note's body is empty`, () => {
      beforeEach(async () => {
        note = await noteFactory.createForFName("new note");
      });

      it("WHEN applying a template, THEN replace note's body with template's body", async () => {
        await runEngineTestV5(
          async ({ engine }) => {
            const resp = SchemaUtils.applyTemplate({
              template,
              note,
              engine,
            });
            expect(resp).toBeTruthy();
            expect(note.body).toEqual(engine.notes["foo"].body);
          },
          {
            expect,
            preSetupHook: ENGINE_HOOKS.setupSchemaPreseet,
          }
        );
      });

      it("WHEN applying a template with date variables, THEN replace note's body with template's body and with proper date substitution", async () => {
        const dateTemplate: SchemaTemplate = {
          id: "date-variables",
          type: "note",
        };
        await runEngineTestV5(
          async ({ engine }) => {
            const resp = SchemaUtils.applyTemplate({
              template: dateTemplate,
              note,
              engine,
            });
            expect(resp).toBeTruthy();
            expect(note.body).not.toEqual(engine.notes["date-variables"].body);
            expect(note.body.trim()).toEqual(
              `Today is ${Time.now().year}.${Time.now().month}.${
                Time.now().day
              }` +
                "\n" +
                `This link goes to [[daily.journal.${Time.now().year}.${
                  Time.now().month
                }.${Time.now().day}]]`
            );
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
        note = await noteFactory.createForFName("new note");
        note.body = noteBody;
      });

      it("WHEN applying a template, THEN append note's body with a \\n + template's body", async () => {
        await runEngineTestV5(
          async ({ engine }) => {
            const resp = SchemaUtils.applyTemplate({
              template,
              note,
              engine,
            });
            expect(resp).toBeTruthy();
            expect(note.body).toEqual(
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

    describe("GIVEN template type is not a note", async () => {
      beforeEach(async () => {
        note = await noteFactory.createForFName("new note");
      });

      it("WHEN applying a template, THEN do nothing and return false ", async () => {
        await runEngineTestV5(
          async ({ engine }) => {
            const resp = SchemaUtils.applyTemplate({
              template: { id: "foo", type: "snippet" },
              note,
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
