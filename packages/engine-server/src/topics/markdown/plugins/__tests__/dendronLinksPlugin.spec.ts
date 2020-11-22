import unified from "unified";
import { DendronLinksOpts, dendronLinksPlugin } from "../dendronLinksPlugin";
import markdownParse from "remark-parse";

function getProc(opts?: DendronLinksOpts) {
  return unified()
    .use(markdownParse, { gfm: true })
    .use(dendronLinksPlugin, opts);
}

describe("basic", () => {
  test("init", () => {
    const resp = getProc().parse(`[["foo.md"]]`);
    expect(resp).toMatchSnapshot();
    // @ts-ignore
    expect(resp.children[0].children[0].type).toEqual("wikiLink");
  });

  test("doesn't parse inline code block", () => {
    const resp = getProc().parse("`[[foo.md]]`");
    expect(resp).toMatchSnapshot("bond");
  });

  // test("relative anchor", () => {
  //   getProc({replaceLink}).parse(`[["foo#bar]]`)
  // })
});
