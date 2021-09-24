import {
  FuseEngine,
  NotePropsDict,
  NoteIndexProps,
} from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import Fuse from "fuse.js";

type TestData = {
  fname: string;
  updated: number;
  stub?: boolean;
};

async function testDataToNotePropsDict(
  testData: TestData[]
): Promise<NotePropsDict> {
  const dict: NotePropsDict = {};

  for (const td of testData) {
    const note = await NoteTestUtilsV4.createNote({
      fname: td.fname,
      vault: { fsPath: "/tmp/vault-path" },
      wsRoot: "/tmp",
      noWrite: true,
    });

    note.stub = td.stub;
    note.updated = td.updated;

    dict[note.id] = note;
  }

  return dict;
}

const testDataFromFNames = (fnames: string[]): TestData[] => {
  return fnames.map((fname) => ({ fname, updated: 1 }));
};

function assertHasFName(queryResult: NoteIndexProps[], fname: string) {
  expect(queryResult.some((qr) => qr.fname === fname)).toBeTruthy();
}

function assertDoesNotHaveFName(queryResult: NoteIndexProps[], fname: string) {
  expect(queryResult.some((qr) => qr.fname === fname)).toBeFalsy();
}

async function initializeFuseEngine(testData: TestData[]): Promise<FuseEngine> {
  const fuseEngine = new FuseEngine({});
  const notePropsDict: NotePropsDict = await testDataToNotePropsDict(testData);
  await fuseEngine.updateNotesIndex(notePropsDict);
  return fuseEngine;
}

const queryTestV1 = ({
  fuseEngine,
  qs,
  expectedFNames,
}: {
  fuseEngine: FuseEngine;
  qs: string;
  expectedFNames: string[];
}) => {
  const notes = fuseEngine.queryNote({ qs });

  expectedFNames.forEach((expectedFname) => {
    const wasFound = notes.some((n) => n.fname === expectedFname);
    if (!wasFound) {
      fail(`Did not find '${expectedFname}' when querying for '${qs}'`);
    }
  });
};

describe("Fuse utility function tests", () => {
  describe(`doesContainSpecialQueryChars`, () => {
    test.each([
      // Fuse doesn't treat * specially but we map * to ' ' hence we treat it as special character.
      ["dev*ts", true],
      ["dev vs", true],
      ["^vs", true],
      ["vs$", true],
      ["vs$", true],
      ["dev|vs", true],
      ["!vs", true],
      ["=vs", true],
      ["'vs", true],
      ["dev-vs", false],
      ["dev_vs", false],
    ])(
      `WHEN input="%s" THEN result is expected to be %s`,
      (input: string, expected: boolean) => {
        expect(FuseEngine.doesContainSpecialQueryChars(input)).toEqual(
          expected
        );
      }
    );
  });

  describe("formatQueryForFuse", () => {
    test.each([
      ["dev*vs", "dev vs"],
      ["dev*vs*ts", "dev vs ts"],
    ])(
      'WHEN input="%s" THEN output is "%s"',
      (input: string, expected: string) => {
        expect(FuseEngine.formatQueryForFuse({ qs: input })).toEqual(expected);
      }
    );

    describe(`GIVEN that onlyDirectChildren is set`, () => {
      test.each([
        ["dev.vs.", "^dev.vs."],
        ["^dev.vs.", "^dev.vs."],
      ])(
        'WHEN input="%s" THEN output is "%s"',
        (input: string, expected: string) => {
          expect(
            FuseEngine.formatQueryForFuse({
              qs: input,
              onlyDirectChildren: true,
            })
          ).toEqual(expected);
        }
      );
    });
  });

  describe("sortMatchingScores", () => {
    function createIndexItem(opts: {
      fname: string;
      updated: number;
      stub?: boolean;
    }): NoteIndexProps {
      return {
        id: opts.fname,
        updated: opts.updated,
        title: opts.fname,
        fname: opts.fname,
        vault: { fsPath: "vault-path" },
        stub: opts.stub,
      };
    }

    const createFoundItem = (opts: {
      score: number;
      fname: string;
      updated: number;
      stub?: boolean;
    }) => {
      return {
        item: createIndexItem(opts),
        score: opts.score,
        matches: [],
        refIndex: 1,
      };
    };

    describe("WHEN sorting fuse results", () => {
      let sortResults: Fuse.FuseResult<NoteIndexProps>[];

      beforeAll(() => {
        sortResults = FuseEngine.sortMatchingScores([
          createFoundItem({ fname: "match-a1", updated: 2, score: 0.1 }),
          createFoundItem({ fname: "match-a2", updated: 3, score: 0.1 }),
          // Stubs are going to have a latest update time but should come
          // after real matches in search results (when stubs have matching score with real result).
          createFoundItem({
            fname: "stub-a2",
            updated: 999,
            score: 0.1,
            stub: true,
          }),
          createFoundItem({ fname: "best-match", updated: 1, score: 0.01 }),
          createFoundItem({ fname: "worst-match", updated: 1, score: 0.99 }),
        ]);
      });

      it("THEN best matched score should be first, regardless of update time", () => {
        expect(sortResults[0].item.fname).toEqual("best-match");
      });

      it("WHEN two items have the same score THEN the more recently updated comes first", () => {
        expect(sortResults[1].item.fname).toEqual("match-a2");
        expect(sortResults[2].item.fname).toEqual("match-a1");
      });

      it("WHEN stub has same score as a match THEN it comes after the real match", () => {
        expect(sortResults[2].item.fname).toEqual("match-a1");
        expect(sortResults[3].item.fname).toEqual("stub-a2");
      });

      it("WHEN item has worst match score THEN it comes last", () => {
        expect(sortResults[sortResults.length - 1].item.fname).toEqual(
          "worst-match"
        );
      });
    });
  });
});

describe("Fuse Engine tests with dummy data", () => {
  const DATA_1: TestData[] = [
    { fname: "note-1", updated: 2 },
    { fname: "note-2", updated: 3 },
    { fname: "note-3", updated: 4 },
    { fname: "user.tim.test", updated: 1 },
    { fname: "parent.new-note-1", updated: 1 },
    { fname: "some.note.name.with.big-o", updated: 1 },
  ];

  describe(`GIVEN engine with notes: '${DATA_1.map((n) => n.fname)}'`, () => {
    let fuseEngine: FuseEngine;
    beforeAll(async () => {
      fuseEngine = await initializeFuseEngine(DATA_1);
    });

    describe('WHEN querying for "note"', () => {
      let queryResult: NoteIndexProps[];
      beforeAll(() => {
        queryResult = fuseEngine.queryNote({ qs: "note" });
      });

      it("THEN include note-1", () => {
        assertHasFName(queryResult, "note-1");
      });

      it("THEN include note-2", () => {
        assertHasFName(queryResult, "note-1");
      });

      it("THEN notes with same matching score should be ordered by update time", () => {
        expect(queryResult[0].fname).toEqual("note-3");
        expect(queryResult[1].fname).toEqual("note-2");
        expect(queryResult[2].fname).toEqual("note-1");
      });

      it('THEN include "parent.new-note-1"', () => {
        assertHasFName(queryResult, "parent.new-note-1");
      });

      it('THEN exclude "user.tim.test"', () => {
        assertDoesNotHaveFName(queryResult, "user.tim.test");
      });
    });

    describe('WHEN querying for "note-1"', () => {
      let queryResults: NoteIndexProps[];

      beforeAll(() => {
        queryResults = fuseEngine.queryNote({ qs: "note-1" });
      });

      it('THEN exact match "note-1" comes first', () => {
        expect(queryResults.length).toBeTruthy();
        expect(queryResults[0].fname).toEqual("note-1");
      });

      it('THEN string which contains exact match "parent.new-note-1" comes second', () => {
        expect(queryResults[1].fname).toEqual("parent.new-note-1");
      });

      it("THEN string with same size but not exact match is excluded.", () => {
        assertDoesNotHaveFName(queryResults, "note-2");
      });
    });

    describe(`WHEN querying for 'big o'`, () => {
      let queryResults: NoteIndexProps[];

      beforeAll(() => {
        queryResults = fuseEngine.queryNote({ qs: "big o" });
      });

      it(`THEN should match 'some.note.name.with.big-o'`, () => {
        assertHasFName(queryResults, "some.note.name.with.big-o");
      });
    });
  });
});

describe("FuseEngine tests with extracted data.", () => {
  describe('GIVEN engine with notes containing "dev" extracted from dendron.dendron-site/vault ', () => {
    const DATA_FILES_WITH_DEV: TestData[] = testDataFromFNames([
      "dendron.contribute.dev",
      "dendron.contribute.first-dev",
      "dendron.dev.api",
      "dendron.dev.api.seeds",
      "dendron.dev.arch",
      "dendron.dev.cook",
      "dendron.dev.debug",
      "dendron.dev.design.commands",
      "dendron.dev.design.commands.rename",
      "dendron.dev.design.engine",
      "dendron.dev.design.files-vs-folders",
      "dendron.dev.design.lookup",
      "dendron.dev.design",
      "dendron.dev.design.pods",
      "dendron.dev.design.publishing",
      "dendron.dev.design.remark",
      "dendron.dev.design.seeds",
      "dendron.dev.errors",
      "dendron.dev.issues",
      "dendron.dev",
      "dendron.dev.pull-request",
      "dendron.dev.qa.build-repo",
      "dendron.dev.qa",
      "dendron.dev.qa.notes",
      "dendron.dev.qa.perf",
      "dendron.dev.qa.sop",
      "dendron.dev.qa.verdaccio",
      "dendron.dev.qa.windows",
      "dendron.dev.ref.kevins-setup",
      "dendron.dev.ref.lifecylce",
      "dendron.dev.ref",
      "dendron.dev.ref.vscode",
      "dendron.dev.ref.web-dev",
      "dendron.dev.remote",
      "dendron.dev.setup.common",
      "dendron.dev.setup",
      "dendron.dev.style",
      "dendron.dev.tools",
      "dendron.dev.triage.bots",
      "dendron.dev.triage",
      "dendron.dev.triage.process",
      "dendron.dev.troubleshooting",
      "dendron.dev.windows",
      "dendron.topic.pod.dev",
      "pkg.common-all.dev",
      "pkg.dendron-api-server.dev",
      "pkg.dendron-cli.dev",
      "pkg.dendron-engine.dev.cook",
      "pkg.dendron-engine.dev",
      "pkg.dendron-markdown.dev",
      "pkg.dendron-next-server.dev",
      "pkg.dendron-next-server.dev.remote",
      "pkg.dendron-next-server.t.preview.dev",
      "pkg.dendron-plugin.dev",
      "pkg.devto-pod",
      "pkg.nextjs-template.dev",
    ]);

    let fuseEngine: FuseEngine;
    beforeAll(async () => {
      fuseEngine = await initializeFuseEngine(
        DATA_FILES_WITH_DEV.concat({
          fname: "dendron.dev.i-am-a-stub",
          updated: 1,
          stub: true,
        })
      );
    });

    describe(`AND using default query parameters`, () => {
      test.each([
        [
          "dev*vs",
          ["dendron.dev.design.files-vs-folders", "dendron.dev.ref.vscode"],
        ],
        [
          "dev vs",
          ["dendron.dev.design.files-vs-folders", "dendron.dev.ref.vscode"],
        ],
        [
          "vs dev",
          ["dendron.dev.design.files-vs-folders", "dendron.dev.ref.vscode"],
        ],
        ["devapi", ["dendron.dev.api", "dendron.dev.api.seeds"]],
        ["dendron rename", ["dendron.dev.design.commands.rename"]],
        ["rename dendron", ["dendron.dev.design.commands.rename"]],
        [
          "dendron.dev design.commands.rename",
          ["dendron.dev.design.commands.rename"],
        ],
        [
          "^dendron.dev.design.commands.rename",
          ["dendron.dev.design.commands.rename"],
        ],
        [
          "dendron.dev.design.commands.rename$",
          ["dendron.dev.design.commands.rename"],
        ],
        [
          "=dendron.dev.design.commands.rename",
          ["dendron.dev.design.commands.rename"],
        ],
        [
          "dendron.dev.design.commands.rename !git",
          ["dendron.dev.design.commands.rename"],
        ],
        [
          "'dendron.dev.design 'commands.rename",
          ["dendron.dev.design.commands.rename"],
        ],
      ])(
        "WHEN query for '%s' THEN results to contain %s",
        (qs: string, expectedFNames: string[]) => {
          queryTestV1({
            fuseEngine,
            qs: qs,
            expectedFNames: expectedFNames,
          });
        }
      );
    });

    describe(`WHEN querying for 'dendron.dev' AND onlyDirectChildren is set.'`, () => {
      let notes: NoteIndexProps[];

      beforeEach(() => {
        notes = fuseEngine.queryNote({
          qs: "dendron.dev.",
          onlyDirectChildren: true,
        });
      });

      it(`THEN match direct child 'dendron.dev.design'`, () => {
        assertHasFName(notes, "dendron.dev.design");
      });

      it(`THEN do NOT match grandchild 'dendron.dev.design.commands'`, () => {
        assertDoesNotHaveFName(notes, "dendron.dev.design.commands");
      });

      it(`THEN do NOT match stub child 'dendron.dev.i-am-a-stub'`, () => {
        assertDoesNotHaveFName(notes, "dendron.dev.i-am-a-stub");
      });
    });
  });
});
