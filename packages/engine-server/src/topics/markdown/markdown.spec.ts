import { EngineTestUtils } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { replaceRefs } from "./plugins/replaceRefs";
import { createNoteFromMarkdown, getProcessor } from "./utils";

// @ts-ignore
const mdSimple = `
# H1 Header

h1 content

h1.1 content

## H2 Header

h2 content

### H3 Header

h3 content

- bullet1
- bullet2

1. ordered1
2. ordered2

\`\`\`
code fence
\`\`\`

\`code span\`

- [link](normal-link)
- ![image](image-link.jpg)
- [[foo-wiki-link]]
- [[label|foo-wiki-link]]
- [[label|foo-wiki-link]]#foobar
`;

// describe("Tokens2Md", () => {
//   test("identity", () => {
//     const tokens = md2Tokens(mdSimple);
//     // expect(new MDRenderer().renderInline(tokens, {}, {})).toMatchSnapshot("inline");

//     expect(mdSimple).toMatchSnapshot("orig");
//     expect(parse(mdSimple)).toMatchSnapshot("new");
//     const out = getProcessor()
//       .use(replaceRefs, {
//         refType: LinkType.IMAGE_LINK,
//         imageRefPrefix: "bond",
//       })
//       .processSync(mdSimple);
//     expect(out).toMatchSnapshot("processed");
//     //expect(md().render(mdSimple)).toMatchSnapshot("normal");
//     // expect(new MDRenderer().render(tokens, {}, {})).toMatchSnapshot(
//     //   "md-render"
//     // );
//     //expect(tokens2MD(ast)).toEqual(mdSimple);
//     // expect(mdNodes2MD(mdSimple)).toEqual(mdSimple);
//   });
// });

describe("replaceRefs", () => {
  // @ts-ignore
  let root: string;

  beforeEach(() => {
    root = EngineTestUtils.setupStoreDir();
  });

  test("imagePrefix", () => {
    // const uri = path.join(root, "sample.image-link.md");
    // const note = createNoteFromMarkdown(uri);
    // expect(note.toRawProps(false, { ignoreNullParent: true })).toMatchSnapshot(
    //   "rawprops"
    // );
    const out = getProcessor()
      .use(replaceRefs, { imageRefPrefix: "bond/" })
      .processSync(`![alt-text](image-url.jpg)`);
    expect(_.trim(out.toString())).toEqual("![alt-text](bond/image-url.jpg)");
  });

  test("md2wiki", () => {
    const links = `
[link](normal-link)

- [[foo-wiki-link]]
- [[label|foo-wiki-link]]
- [[label|foo-wiki-link]]#foobar
    `;
    const proc = getProcessor().use(replaceRefs, { wikiLink2Md: true });
    const out = proc.processSync(links);
    const tokens = proc.parse(links);

    expect(out.toString()).toMatchSnapshot("raw");
    expect(tokens).toMatchSnapshot("parsed");
  });
});
