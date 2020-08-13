import {
  parseDendronRef,
  parseFileLink,
  DendronRefLink,
  matchEmbedMarker,
} from "../utils";

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

describe("parseIdLink", () => {
  // it("just id", () => {
  //   expect(parseFileLink("aa0b5d00-9b71-403e-bca3-ffe78fa6844d")).toEqual({
  //     name: "foo",
  //     type: "file",
  //   });
  // });
  // it("one anchor", () => {
  //   expect(parseFileLink("[[foo]]#head1")).toEqual({
  //     name: "foo",
  //     anchorStart: "head1",
  //     type: "file",
  //   });
  // });
  // it("all parts", () => {
  //   expect(parseFileLink("[[foo]]#head1:#head2")).toEqual({
  //     anchorEnd: "head2",
  //     anchorStart: "head1",
  //     name: "foo",
  //     type: "file",
  //   });
  // });
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
  //   it("testFileRef", () => {
  //     const ref = "ref: [[foo.md]]";
  //     expect(parseDendronRef(ref)).toEqual({
  //       linkType: "file",
  //       linkDirection: "to",
  //       start: {
  //         name: "foo",
  //       },
  //     });
  //   });
});
