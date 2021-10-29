import { runEngineTestV5 } from "../../../../engine";
import { ENGINE_HOOKS } from "../../../../presets";
import { DendronEngineClient, SchemaParser } from "@dendronhq/engine-server";
import { getAllFiles, vault2Path } from "@dendronhq/common-server";
import {
  DendronError,
  SchemaModuleProps,
  SchemaProps,
  WorkspaceOpts,
} from "@dendronhq/common-all";

async function parseSchemas(
  preSetupHook: (opts: WorkspaceOpts & { extra?: any }) => Promise<any>
): Promise<{
  schemas: SchemaModuleProps[];
  errors: DendronError[] | null;
}> {
  let payload: {
    schemas: SchemaModuleProps[];
    errors: DendronError[] | null;
  };

  await runEngineTestV5(
    async ({ engine, vaults, wsRoot }) => {
      const engineClient = engine as DendronEngineClient;

      const parser: SchemaParser = new SchemaParser({
        store: engineClient.store,
        logger: engineClient.logger,
      });
      const vault = vaults[0];
      const vpath = vault2Path({ vault, wsRoot });
      const schemaFiles = getAllFiles({
        root: vpath,
        include: ["*.schema.yml"],
      }) as string[];

      console.log(`vpath`);
      console.log(`Schema files: '${JSON.stringify(schemaFiles)}'`);

      payload = await parser.parse(schemaFiles, vault);
    },
    { expect, preSetupHook: preSetupHook }
  );

  // @ts-ignore
  return payload;
}

describe(`schemaParser tests:`, () => {
  describe(`WHEN parsing non-inlined basic schema`, () => {
    let payload: {
      schemas: SchemaModuleProps[];
      errors: DendronError[] | null;
    };

    beforeAll(async () => {
      payload = await parseSchemas(ENGINE_HOOKS.setupSchemaPreseet);
    });

    it(`THEN payload has no errors`, () => {
      expect(payload.errors).toEqual(null);
    });

    describe(`AND 'bar' related schemas are present`, () => {
      let barSchema: SchemaProps;
      let ch1Schema: SchemaProps;
      let ch2Schema: SchemaProps;

      beforeAll(() => {
        // Bar schemas are at 0 index in the basic setup case.
        const barSchemaGroup = payload.schemas[0];

        barSchema = barSchemaGroup.schemas["bar"];
        ch1Schema = barSchemaGroup.schemas["ch1"];
        ch2Schema = barSchemaGroup.schemas["ch2"];

        expect(barSchema).toBeDefined();
        expect(ch1Schema).toBeDefined();
        expect(ch2Schema).toBeDefined();
      });

      it(`THEN bar schema has 2 children`, () => {
        expect(barSchema.children.length).toEqual(2);
      });

      it(`THEN both of the children are accounted`, () => {
        expect(barSchema.children[0]).toEqual("ch1");
        expect(barSchema.children[1]).toEqual("ch2");
      });

      it(`THEN vault of schema is correctly specified`, () => {
        expect(barSchema.vault.fsPath).toEqual("vault1");
      });

      it(`THEN id of bar schema is set`, () => {
        expect(barSchema.id).toEqual("bar");
      });

      it(`THEN title of bar schema is set`, () => {
        expect(barSchema.title).toEqual("bar");
      });

      it(`THEN type of schema is set`, () => {
        expect(barSchema.type).toEqual("schema");
      });

      it(`THEN ch1 has parent set`, () => {
        expect(ch1Schema.parent).toEqual("bar");
      });

      it(`THEN ch1 does NOT have namespace set`, () => {
        expect(ch1Schema.data.namespace).toBeFalsy();
      });

      it(`THEN ch1 has template set`, () => {
        expect(ch1Schema.data.template?.id).toEqual(`bar.template.ch1`);
        expect(ch1Schema.data.template?.type).toEqual(`note`);
      });

      it(`THEN ch2 has namespace set`, () => {
        expect(ch2Schema.data.namespace).toBeTruthy();
      });

      it(`THEN ch2 has template set`, () => {
        expect(ch2Schema.data.template?.id).toEqual(`bar.template.ch2`);
        expect(ch2Schema.data.template?.type).toEqual(`note`);
      });
    });

    // Make sure we aren't forgetting the other schemas that are present.
    it(`THEN 'foo' schema is also present`, () => {
      // Foo schemas are at index [1] in the basic case.
      const fooSchemaGroup = payload.schemas[1];
      expect(fooSchemaGroup.schemas["foo"]).toBeTruthy();
    });
  });

  describe(`WHEN parsing non-inlined schema with patterns`, () => {
    let payload: {
      schemas: SchemaModuleProps[];
      errors: DendronError[] | null;
    };

    beforeAll(async () => {
      payload = await parseSchemas(
        ENGINE_HOOKS.setupSchemaPresetWithNamespaceTemplate
      );
    });

    it(`THEN payload has no errors`, () => {
      expect(payload.errors).toEqual(null);
    });

    describe(`AND parsed the daily journal grouped schema:`, () => {
      let journalSchemaGroup: SchemaModuleProps;

      beforeAll(() => {
        journalSchemaGroup = payload.schemas[1];
      });

      it(`THEN root id is set as daily`, () => {
        expect(journalSchemaGroup.root.id).toEqual("daily");
      });

      it(`THEN root child is journal`, () => {
        expect(journalSchemaGroup.root.children[0]).toEqual("journal");
      });

      it(`THEN root parent is root`, () => {
        expect(journalSchemaGroup.root.parent).toEqual("root");
      });

      describe(`AND parsed journal schema`, () => {
        let journalSchema: SchemaProps;

        beforeAll(() => {
          journalSchema = journalSchemaGroup.schemas["journal"];
        });

        it(`THEN journal schema has parent set to daily`, () => {
          expect(journalSchema.parent).toEqual("daily");
        });

        it(`THEN journal schema has child set to year`, () => {
          expect(journalSchema.children[0]).toEqual("year");
        });
      });

      describe(`AND parsed year schema`, () => {
        let yearSchema: SchemaProps;

        beforeAll(() => {
          yearSchema = journalSchemaGroup.schemas["year"];
        });

        it(`THEN year schema has pattern`, () => {
          expect(yearSchema.data.pattern).toEqual("[0-2][0-9][0-9][0-9]");
        });

        it(`THEN year schema has journal parent`, () => {
          expect(yearSchema.parent).toEqual("journal");
        });
      });

      describe(`AND parsed month schema`, () => {
        it(`THEN month schema has pattern`, () => {
          expect(journalSchemaGroup.schemas["month"].data.pattern).toEqual(
            "[0-9][0-9]"
          );
        });
      });

      describe(`AND parsed day schema`, () => {
        let daySchema: SchemaProps;

        beforeAll(() => {
          daySchema = journalSchemaGroup.schemas["day"];
        });

        it(`THEN day schema is set to namespace`, () => {
          expect(daySchema.data.namespace).toBeTruthy();
        });

        it(`THEN day schema has pattern`, () => {
          expect(daySchema.data.pattern).toEqual("[0-9][0-9]");
        });

        it(`THEN day schema has template`, () => {
          expect(daySchema.data.template?.id).toEqual("journal.template");
          expect(daySchema.data.template?.type).toEqual("note");
        });
      });
    });
  });

  /**
   * Most of the inlined children in the test case for inline schemas will not have
   * id value within the test input (id values for those entries will be generated
   * by the parse logic).
   * */
  describe(`WHEN parsing inline schema`, () => {
    let payload: {
      schemas: SchemaModuleProps[];
      errors: DendronError[] | null;
    };
    let inlined: SchemaModuleProps;

    beforeAll(async () => {
      payload = await parseSchemas(ENGINE_HOOKS.setupInlineSchema);
      inlined = payload.schemas.filter((sch) => sch.fname === "inlined")[0];
    });

    it(`THEN payload does not have errors`, () => {
      expect(payload.errors).toEqual(null);
    });

    describe(`AND parsing non inline part of schema which contains imported id`, () => {
      let foosParent: SchemaProps;

      beforeAll(() => {
        foosParent = inlined.schemas["id_with_imported_child"];
      });

      it(`THEN we have id to imported schema within node that used it.`, () => {
        expect(foosParent.children[0]).toEqual("foo.foo");
      });

      it(`THEN we can reference imported schema object`, () => {
        expect(inlined.schemas["foo.foo"].id).toEqual("foo.foo");
      });
    });

    describe(`AND inline schema is parsed`, () => {
      it(`THEN inlined root has daily id`, () => {
        expect(inlined.root.id).toEqual("daily");
      });

      describe(`AND daily has journal child`, () => {
        let journal: SchemaProps;

        beforeAll(() => {
          journal = inlined.schemas[inlined.root.children[0]];
        });

        it(`THEN patternless journal id is equal to journal`, () => {
          // Journal entry does not have a pattern but its manual id should be
          // good enough for our schema.
          expect(journal.id).toEqual("journal");
        });

        it(`THEN journal title is set to id`, () => {
          // Journal does not have a title set within the test input so its title
          // is expected to default to id.
          expect(journal.title).toEqual(journal.id);
        });

        describe(`AND journal has year child. (year has optional id set)`, () => {
          let year: SchemaProps;

          beforeAll(() => {
            year = inlined.schemas["year_id"];
          });

          it(`THEN year has expected pattern`, () => {
            expect(year.data.pattern).toEqual("[0-2][0-9][0-9][0-9]");
          });

          describe(`AND year has month child`, () => {
            let month: SchemaProps;

            beforeAll(() => {
              month = inlined.schemas[year.children[0]];
            });

            it(`THEN month has expected pattern`, () => {
              expect(month.data.pattern).toEqual("[0-1][0-9]");
            });

            it(`THEN title-less month has title set to its id`, () => {
              expect(month.title).toEqual(month.id);
            });

            describe(`AND month has day child`, () => {
              let day: SchemaProps;

              beforeAll(() => {
                day = inlined.schemas[month.children[0]];
              });

              it(`THEN day has expected pattern`, () => {
                expect(day.data.pattern).toEqual("[0-3][0-9]");
              });

              it(`THEN day has expected template`, () => {
                expect(day.data.template?.id).toEqual("templates.day");
                expect(day.data.template?.type).toEqual("note");
              });
            });
          });
        });
      });
    });

    describe(`AND parsing part which has untyped template`, () => {
      let parentOfDesired: SchemaProps;

      beforeAll(() => {
        parentOfDesired =
          inlined.schemas["with_child_that_has_untyped_template"];
      });

      describe(`AND parses element which has untyped template`, () => {
        let withUntypedTemplate: SchemaProps;

        beforeAll(() => {
          withUntypedTemplate = inlined.schemas[parentOfDesired.children[0]];
        });

        it(`THEN has expected pattern`, () => {
          expect(withUntypedTemplate.data.pattern).toEqual(
            "has_untyped_template"
          );
        });

        it(`THEN sets the id of the template`, () => {
          expect(withUntypedTemplate.data.template?.id).toEqual(
            "templates.untyped"
          );
        });

        it(`THEN defaults to note type for template`, () => {
          expect(withUntypedTemplate.data.template?.type).toEqual("note");
        });
      });
    });
  });
});
