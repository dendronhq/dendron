import {
  parseDendronRef,
  parseFileLink,
  DendronRefLink,
  matchRefMarker,
  replaceRefWithMPEImport,
  stripLocalOnlyTags,
  extractBlock,
} from "../utils";
import _ from "lodash";
import { EngineTestUtils } from "@dendronhq/common-server/src";
import fs from "fs-extra";
import path from "path";

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
    root = await EngineTestUtils.setupStoreDir({ copyFixtures: true });
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

  it.skip("anchor start alt", async () => {
    const txt = ["", `# Tasks`, "task1", "task2"];
    root = EngineTestUtils.setupStoreDir({
      initDirCb: (dirPath: string) => {
        fs.writeFileSync(path.join(dirPath, "daily.tasks.md"), txt.join("\n"), {
          encoding: "utf8",
        });
      },
    });
    expect(
      replaceRefWithMPEImport("((ref:[[daily.tasks]]#Tasks))", {
        root,
      })
    ).toEqual('@import "daily.task.md" {line_begin=1}');
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
