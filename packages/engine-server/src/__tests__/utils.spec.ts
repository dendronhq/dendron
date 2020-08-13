import {
  parseDendronRef,
  parseFileLink,
  DendronRefLink,
  matchEmbedMarker,
  extractBlock,
} from "../utils";
import _ from "lodash";

function createFileLink(opts?: Partial<DendronRefLink>): DendronRefLink {
  return {
    name: "foo",
    type: "file",
    ...opts,
  };
}

describe("matchEmbedMarker", () => {
  test("basic", () => {
    // @ts-ignore
    expect(matchEmbedMarker("<!--(([[class.mba.chapters.2]]))-->")[1]).toEqual(
      "[[class.mba.chapters.2]]"
    );
  });
});

describe("parseFileLink", () => {
  it("just file", () => {
    expect(parseFileLink("[[foo]]")).toEqual({
      name: "foo",
      type: "file",
    });
  });

  it("one anchor", () => {
    expect(parseFileLink("[[foo]]#head1")).toEqual({
      name: "foo",
      anchorStart: "head1",
      type: "file",
    });
  });

  it("all parts", () => {
    expect(parseFileLink("[[foo]]#head1:#head2")).toEqual({
      anchorEnd: "head2",
      anchorStart: "head1",
      name: "foo",
      type: "file",
    });
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
    expect(extractBlock(FILE_TEXT, createFileLink())).toEqual(
      _.trim(FILE_TEXT)
    );
  });

  it("anchor start", () => {
    expect(
      extractBlock(
        FILE_TEXT,
        createFileLink({
          anchorStart: "Head 2.1",
        })
      )
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

  it("anchor stard and end", () => {
    expect(
      extractBlock(
        FILE_TEXT,
        createFileLink({
          anchorStart: "Head 2.1",
          anchorEnd: "Head 2.2",
        })
      )
    ).toEqual(
      _.trim(`
## Head 2.1

Head 2.1 Text

### Head 2.1.1

Head 2.1.1 Text`)
    );
  });
});
