import { EngineTestUtils } from "@dendronhq/common-server";
import { FileParserUtils } from "../parser";
import _ from "lodash";

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
    expect(_.map(schemas, (s) => s.id).sort()).toEqual(
      [
        "foo",
        "bar.bar",
        "bar.one",
        "baz.bar.bar",
        "baz.baz",
        "baz.bar.one",
        "baz.ns",
      ].sort()
    );
    // @ts-ignore
    expect(_.find(schemas, { id: "foo" }).children).toEqual([
      "bar.bar",
      "baz.baz",
    ]);
    // @ts-ignore
    expect(_.find(schemas, { id: "bar.bar" }).children).toEqual(["bar.one"]);
  });
});
