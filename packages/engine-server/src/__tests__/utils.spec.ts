import {
  parseDendronRef,
  parseFileLink,
  DendronRefLink,
  matchRefMarker,
  extractBlock,
  replaceRefWithMPEImport,
} from "../utils";
import _ from "lodash";
import { setupTmpDendronDir } from "../testUtils";

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
    expect(matchRefMarker("<!--(([[class.mba.chapters.2]]))-->")[1]).toEqual(
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
    root = await setupTmpDendronDir({ copyFixtures: true });
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
    ).toEqual('@import "ref.md" {line_begin=11}');
  });

  it("anchor start", () => {
    expect(
      replaceRefWithMPEImport("((ref:[[ref]]#head2.1:#head2.3))", {
        root,
      })
    ).toEqual('@import "ref.md" {line_begin=11 line_end=19}');
  });
});
