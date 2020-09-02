import unified from "unified";
import { dendronLinksPlugin } from "../dendronLinksPlugin";
import markdownParse from "remark-parse";

function getProcessor() {
  let processor: unified.Processor | null = null;
  return (processor = unified()
    .use(markdownParse, { gfm: true })
    .use(dendronLinksPlugin));
}

describe("basic", () => {
  test("init", () => {
    const resp = getProcessor().parse(`[["foo.md"]]`);
    expect(resp).toMatchSnapshot();
    // @ts-ignore
    expect(resp.children[0].children[0].type).toEqual("wikiLink");
  });

  test("doesn't parse inline code block", () => {
    const resp = getProcessor().parse("`[[foo.md]]`");
    expect(resp).toMatchSnapshot("bond");
    // child1 paragraph, child2 link
    // @ts-ignore
    // expect(resp.children[0].children[0].data.link).not.toEqual({
    //   type: "file",
    //   name: "foo",
    //   anchorStart: undefined,
    //   anchorEnd: undefined,
    // });
  });
});
