import { EngineTestUtils } from "@dendronhq/common-server";
import { FileParserUtils } from "../parser";

describe("schema parser ", () => {
  let root: string;

  beforeEach(async () => {
    root = await EngineTestUtils.setupStoreDir({
      storeDirSrc: "engine-server.parser",
    });
    console.log("done");
  });

  test("basic", () => {
    console.log(root);
    const schemas = FileParserUtils.parseSchemaFile("foo.schema.yml", { root });
    expect(schemas).toMatchSnapshot("schemas");
  });
});
