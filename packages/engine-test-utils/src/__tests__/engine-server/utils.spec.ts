import { DNoteRefData, DNoteRefLink, getSlugger } from "@dendronhq/common-all";
import {
  matchRefMarker,
  MDUtilsV4,
  parseDendronRef,
  parseFileLink,
  refLink2String,
  stripLocalOnlyTags,
} from "@dendronhq/engine-server";
import { Node } from "unist";
import _ from "lodash";
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

describe(`matchHeading`, () => {
  const makeHeadingNode = (headingValue: string): Node => {
    const nodeUnparsed = `{
                            "type": "heading",
                            "depth": 1,
                            "children": [
                              {
                                "type": "text",
                                "value": "${headingValue}"
                              }
                            ]
                          }`;
    return JSON.parse(nodeUnparsed) as Node;
  };

  function matchHeadingTest(nodeHeadingValue: string, matchingValue: string) {
    const node = makeHeadingNode(nodeHeadingValue);
    return MDUtilsV4.matchHeading(node, matchingValue, {
      slugger: getSlugger(),
    });
  }

  describe(`GIVEN node made from ASCII characters`, () => {
    it(`WHEN match text fully matches heading value THEN return truthy`, () => {
      expect(matchHeadingTest("head-val-1", "head-val-1")).toBeTruthy();
    });

    it(`WHEN match partially matches heading value THEN return falsy`, () => {
      expect(matchHeadingTest("head-val-1", "head-val")).toBeFalsy();
    });

    it(`WHEN match text does not match heading value THEN return falsy`, () => {
      expect(matchHeadingTest("head-val-1", "head-val-2")).toBeFalsy();
    });
  });

  describe(`GIVEN node made from special characters`, () => {
    it(`WHEN match text with special char removed matches heading value THEN return truthy`, () => {
      expect(matchHeadingTest("head-val-🌲-1", "head-val--1")).toBeTruthy();
    });
  });
});

describe("matchEmbedMarker", () => {
  test("basic", () => {
    //@ts-ignore
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

describe("stripLocalOnlyTags", () => {
  it("basic", () => {
    const txt = `
- this is a bullet
    - this is a secret <!--LOCAL_ONLY_LINE-->
`;
    expect(_.trim(stripLocalOnlyTags(txt))).toEqual("- this is a bullet");
  });
});
