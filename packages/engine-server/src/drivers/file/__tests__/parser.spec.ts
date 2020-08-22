import { EngineTestUtils } from "@dendronhq/common-server";
import { FileParserUtils } from "../parser";
import path from "path";

describe("schema parser ", () => {
  let root: string;
  let bond;

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
