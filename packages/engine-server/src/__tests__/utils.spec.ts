import { DNoteRefData, DNoteRefLink } from "@dendronhq/common-all";
import { EngineTestUtilsV2, FileTestUtils } from "@dendronhq/common-test-utils";
import _ from "lodash";
import {
  extractBlock,
  matchRefMarker,
  parseDendronRef,
  parseFileLink,
  refLink2String,
  replaceRefWithMPEImport,
  stripLocalOnlyTags,
} from "../utils";

function createFileLink(data?: Partial<DNoteRefData>): DNoteRefLink {
  let cleanData: DNoteRefData = _.defaults(data, { type: "file" });
  return {
    from: {
      fname: "foo",
    },
    type: "ref",
    data: cleanData,
  };
}

describe("matchEmbedMarker", () => {
  test("basic", () => {
    // @ts-ignore
    expect(matchRefMarker("<!--(([[class.mba.chapters.2]]))-->")[1]).toEqual(
      "[[class.mba.chapters.2]]"
    );
  });
});

describe("parseFileLink", () => {
  it("just file", () => {
    expect(parseFileLink("[[foo]]")).toEqual(createFileLink());
  });

  it("one anchor", () => {
    expect(parseFileLink("[[foo]]#head1")).toEqual(
      createFileLink({ anchorStart: "head1" })
    );
  });

  it("all parts", () => {
    expect(parseFileLink("[[foo]]#head1:#head2")).toEqual(
      createFileLink({ anchorStart: "head1", anchorEnd: "head2" })
    );
  });

  it("next anchor", () => {
    expect(parseFileLink("[[foo]]#head1:#*")).toEqual(
      createFileLink({ anchorStart: "head1", anchorEnd: "*" })
    );
  });
});

describe("link2String", () => {
  test("file", () => {
    expect(
      refLink2String({
        type: "ref",
        from: {
          fname: "foo",
        },
        data: {
          type: "file",
        },
      })
    ).toEqual("[[foo]]");
  });

  it("one anchor", () => {
    expect(refLink2String(createFileLink({ anchorStart: "head1" }))).toEqual(
      "[[foo]]#head1"
    );
  });

  it("all parts", () => {
    expect(
      refLink2String(
        createFileLink({
          anchorEnd: "head2",
          anchorStart: "head1",
        })
      )
    ).toEqual("[[foo]]#head1:#head2");
  });

  it("next anchor", () => {
    expect(
      refLink2String(
        createFileLink({
          anchorEnd: "*",
          anchorStart: "head1",
        })
      )
    ).toEqual("[[foo]]#head1:#*");
  });
});

describe("parseRef", () => {
  it("describe file ref without extension", () => {
    expect(parseDendronRef("ref: [[foo]]")).toEqual({
      direction: "to",
      link: createFileLink(),
    });
  });

  it("describe file ref", () => {
    expect(parseDendronRef("ref: [[foo.md]]")).toEqual({
      direction: "to",
      link: createFileLink(),
    });
  });

  it("describe file ref with anchor", () => {
    expect(parseDendronRef("ref: [[foo.md]]#head1")).toEqual({
      direction: "to",
      link: createFileLink({ anchorStart: "head1" }),
    });
  });

  it("describe file ref with anchor start and end", () => {
    expect(parseDendronRef("ref: [[foo.md]]#head1:#head2")).toEqual({
      direction: "to",
      link: createFileLink({ anchorStart: "head1", anchorEnd: "head2" }),
    });
  });

  it("describe file ref with anchor start and end, start offset", () => {
    expect(parseDendronRef("ref: [[foo.md]]#head1,1:#head2")).toEqual({
      direction: "to",
      link: createFileLink({
        anchorStart: "head1",
        anchorEnd: "head2",
        anchorStartOffset: 1,
      }),
    });
  });
});

const FILE_TEXT = `
# Head 1

Head 1 Text

## Head 2.1

Head 2.1 Text

### Head 2.1.1

Head 2.1.1 Text

## Head 2.2

Head 2.2 Text`;

describe("extractBlock", () => {
  it("no anchor", () => {
    expect(extractBlock(FILE_TEXT, createFileLink()).block).toEqual(FILE_TEXT);
  });

  it("anchor start", () => {
    expect(
      extractBlock(
        FILE_TEXT,
        createFileLink({
          anchorStart: "Head 2.1",
        })
      ).block
    ).toEqual(
      _.trim(`
## Head 2.1

Head 2.1 Text

### Head 2.1.1

Head 2.1.1 Text

## Head 2.2

Head 2.2 Text`)
    );
  });

  it("anchor start alt", () => {
    const txt = ["", `# Tasks`, "task1", "task2"];
    expect(
      extractBlock(
        txt.join("\n"),
        createFileLink({
          anchorStart: "Tasks",
        })
      ).block
    ).toEqual(_.trim(txt.join("\n")));
  });

  it("anchor stard and end", () => {
    expect(
      extractBlock(
        FILE_TEXT,
        createFileLink({
          anchorStart: "Head 2.1",
          anchorEnd: "Head 2.2",
        })
      ).block
    ).toEqual(
      _.trim(`
## Head 2.1

Head 2.1 Text

### Head 2.1.1

Head 2.1.1 Text`)
    );
  });
});

describe("replaceRefWithMPEImport", () => {
  let root: string;
  beforeEach(async () => {
    root = await EngineTestUtilsV2.setupVault({
      initDirCb: async (vaultPath) => {
        await FileTestUtils.createFiles(vaultPath, [
          {
            path: "ref.md",
            body: `---
id: 5668f5ec-0db3-4530-812d-f8bb4f3c551b
title: ref
desc: ref test
---

# head1

Header 1 text

## head2.1

Header 2 text

## head2.2

head 2.2 text

## head2.3

head w.3 text
          `,
          },
        ]);
      },
    });
  });

  it("basic", () => {
    expect(
      replaceRefWithMPEImport("((ref:[[foo]]))", {
        root,
      })
    ).toEqual('@import "foo.md"');
  });

  it("anchor start", () => {
    expect(
      replaceRefWithMPEImport("((ref:[[ref]]#head2.1))", {
        root,
      })
    ).toEqual('@import "ref.md" {line_begin=10}');
  });

  it("anchor start and end", () => {
    expect(
      replaceRefWithMPEImport("((ref:[[ref]]#head2.1:#head2.3))", {
        root,
      })
    ).toEqual('@import "ref.md" {line_begin=10 line_end=18}');
  });
});

describe("stripLocalOnlyTags", () => {
  it("basic", () => {
    const txt = `
- this is a bullet
    - this is a secret <!--LOCAL_ONLY_LINE-->
`;
    expect(_.trim(stripLocalOnlyTags(txt))).toEqual("- this is a bullet");
  });
});
