import { EngineConnector } from "../../../connector";
import { ParserUtilsV2 } from "../../utilsv2";
import { enrichNode } from "../enrichNode";
import { DendronASTData, DendronASTDest } from "../types";
const remarkRehype = require("remark-rehype");
const rehypeStringify = require("rehype-stringify");

function getProc() {
  const ec = new EngineConnector({
    wsRoot: "/Users/kevinlin/projects/dendronv2/dendron-site",
  });
  const proc = ParserUtilsV2.getRemark()
    .data("engine", ec)
    .data("dendron", { dest: DendronASTDest.HTML } as DendronASTData)
    .use(enrichNode);
  return proc;
}

describe("basic", () => {
  test.only("init", async () => {
    const testString = "[[foo.md]]";
    const resp = getProc().parse(testString);
    expect(resp).toMatchSnapshot("raw");

    const resp2 = await getProc()
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(testString);
    expect(resp2).toMatchSnapshot("compiled");
    expect(
      resp2.contents
        .toString()
        .indexOf("45a154ad-4b5e-4dd3-bdf6-e24a3a60ca68.html") >= 0
    ).toBeTruthy();
  });
});
