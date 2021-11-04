import { SchemaParserV2 } from "@dendronhq/common-server";

describe(`SchemaParserV2 tests:`, () => {
  const VALID_SCHEMA_OPTS = {
    id: "one",
    fname: "/tmp/vault/fname_val.schema.yml",
    vault: { fsPath: "/tmp/vault/" },
  };
  describe(`validateTopSchemasHaveIds tests:`, () => {
    it(`WHEN schema has id THEN pass test`, () => {
      SchemaParserV2.validateTopSchemasHaveIds([{ ...VALID_SCHEMA_OPTS }]);
    });

    it(`WHEN schema is missing id THEN throw`, () => {
      const input = [{ ...VALID_SCHEMA_OPTS }];
      // @ts-ignore
      delete input[0].id;

      expect(() => SchemaParserV2.validateTopSchemasHaveIds(input)).toThrow();
    });
  });

  describe(`createSchema tests:`, () => {
    it(`WHEN valid options are used THEN create schema`, () => {
      const schema = SchemaParserV2.createFromSchemaOpts({
        ...VALID_SCHEMA_OPTS,
      });
      expect(schema.id).toEqual("one");
    });

    it("WHEN incorrect type is used THEN throw", () => {
      expect(() =>
        SchemaParserV2.createFromSchemaOpts({
          ...VALID_SCHEMA_OPTS,
          // @ts-ignore
          pattern: 123,
        })
      ).toThrow(new RegExp(`Pattern should be a string value.*123.*`));
    });

    it(`WHEN unknown field is used THEN throw`, () => {
      expect(() =>
        SchemaParserV2.createFromSchemaOpts({
          ...VALID_SCHEMA_OPTS,
          // @ts-ignore
          i_dont_belong_here: "hi",
        })
      ).toThrow(new RegExp(`Detected invalid property "i_dont_belong_here".*`));
    });
  });
});
