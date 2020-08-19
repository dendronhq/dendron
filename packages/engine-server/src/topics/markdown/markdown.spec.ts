import { EngineTestUtils } from "@dendronhq/common-server";
import _ from "lodash";
import { replaceRefs } from "./plugins/replaceRefs";
import { getProcessor } from "./utils";
import { DendronEngine } from "../../engine";
import { DNodeUtils, Note } from "@dendronhq/common-all";

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

  test("wiki2Md", () => {
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

  test("wiki2Md and swap id", async () => {
    const engine = DendronEngine.getOrCreateEngine({ root });
    await engine.init();
    const proc = getProcessor().use(replaceRefs, {
      wikiLink2Md: true,
      wikiLinkUseId: true,
      engine,
    });

    const note = DNodeUtils.getNoteByFname(
      "engine-server.replace-refs",
      engine,
      { throwIfEmpty: true }
    ) as Note;
    const out = proc.processSync(note.body);

    expect(out.toString()).toMatchSnapshot("raw");
  });
});
