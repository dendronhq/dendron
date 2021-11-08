import {
  CreateSchemaFromHierarchyCommand,
  HierarchyLevel,
  SchemaCandidate,
  SchemaCreator,
  UserQueries,
} from "../../commands/CreateSchemaFromHierarchyCommand";
import { TestNoteFactory } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import sinon from "sinon";
import { beforeEach, describe, it } from "mocha";
import { VSCodeUtils } from "../../utils";
import { DVault } from "@dendronhq/common-all";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import vscode from "vscode";

const TEST_HIERARCHY_LVL = new HierarchyLevel(1, [
  "languages",
  "python",
  "data",
]);

const noteFactory = new TestNoteFactory({
  vault: { fsPath: "/tmp/ws/v1" },
  noWrite: true,
  wsRoot: "/tmp/ws",
});

async function createSchemaCandidates(fnames: string[]) {
  const candidates = [];
  for (const fname of fnames) {
    // eslint-disable-next-line no-await-in-loop
    const note = await noteFactory.createForFName(fname);
    candidates.push({
      note,
      label: `label for fname:'${note.fname}'`,
      detail: `detail for fname:'${note.fname}'`,
    });
  }
  return candidates;
}

async function createTestSchemaCandidatesDefault() {
  const fnames = [
    "languages.python.data",
    "languages.python.data.integer",
    "languages.python.data.string",
    "languages.python.machine-learning",
    "languages.python.machine-learning.pandas",
  ];

  return createSchemaCandidates(fnames);
}

suite("CreateSchemaFromHierarchyCommand tests", () => {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    noSetTimeout: true,
  });

  function runTestWithInlineSchemaSetup(
    func: ({ vaults }: { vaults: any }) => Promise<void>
  ) {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupInlineSchema,
      onInit: func,
    });
  }

  describe(`HierarchyLevel tests:`, () => {
    describe(`GIVEN 'languages.*.data' hierarchy level`, () => {
      let level: HierarchyLevel;
      beforeEach(() => {
        level = new HierarchyLevel(1, ["languages", "python", "data"]);
      });

      it(`THEN have expected label`, () => {
        expect(level.label).toEqual("languages.*.data (python)");
      });

      it(`THEN have expected top id`, () => {
        expect(level.topId()).toEqual("languages");
      });

      it(`THEN produce expected default schema name`, () => {
        expect(level.getDefaultSchemaName()).toEqual("languages");
      });

      describe(`tokenize tests`, () => {
        [
          {
            in: "languages.python.data",
            out: ["languages", "*", "data"],
          },
          {
            in: "languages.python.data.integer",
            out: ["languages", "*", "data", "integer"],
          },
          {
            in: "languages.python.machine-learning",
            out: ["languages", "*", "machine-learning"],
          },
        ].forEach((input) =>
          it(`WHEN fname is '${input.in}' THEN tokenize to '${JSON.stringify(
            input.out
          )}'.`, () => {
            expect(level.tokenize(input.in)).toEqual(input.out);
          })
        );
      });

      describe(`isCandidateNote tests`, () => {
        [
          { in: "languages", out: false },
          { in: "languages.python", out: false },
          { in: "languages.python.data", out: true },
          { in: "languages.python.data.integer", out: true },
          { in: "languages.python.machine-learning", out: true },
        ].forEach((input) =>
          it(`WHEN testing '${input.in}' note THEN ${
            input.out ? "do match" : "do NOT match"
          }.`, () => {
            expect(level.isCandidateNote(input.in)).toEqual(input.out);
          })
        );
      });
    });
  });

  describe(`SchemaCreator tests: `, () => {
    let schemaCandidates: SchemaCandidate[];

    beforeEach(async () => {
      schemaCandidates = await createTestSchemaCandidatesDefault();
    });

    it(`WHEN valid schema candidates THEN generate schema`, () => {
      const actual = SchemaCreator.makeSchemaBody({
        candidates: schemaCandidates,
        hierarchyLevel: new HierarchyLevel(1, ["languages", "python", "data"]),
      });

      const expected = `version: 1
imports: []
schemas:
  - id: languages
    title: languages
    parent: root
    children:
      - pattern: '*'
        children:
          - pattern: data
            children:
              - pattern: integer
              - pattern: string
          - pattern: machine-learning
            children:
              - pattern: pandas\n`;

      expect(expected).toEqual(actual);
    });
  });

  describe(`CreateSchemaFromHierarchyCommand`, () => {
    describe(`sanityCheck tests:`, () => {
      it(`WHEN no active text editor THEN give error`, async () => {
        sinon.stub(VSCodeUtils, "getActiveTextEditor").returns(undefined);

        const cmd = new CreateSchemaFromHierarchyCommand();
        const actual = await cmd.sanityCheck();
        expect(actual?.includes("No note document open")).toBeTruthy();
      });
    });

    describe(`formatSchemaCandidates tests:`, () => {
      describe(`WHEN formatting valid input idx=1 ['h1.h2.h3a', 'h1.h2.h3b']`, () => {
        let schemaCandidates: SchemaCandidate[];

        beforeEach(async () => {
          const cmd = new CreateSchemaFromHierarchyCommand();

          const notes = await noteFactory.createForFNames([
            "h1.h2.h3a",
            "h1.h2.h3b",
          ]);

          schemaCandidates = cmd.formatSchemaCandidates(
            notes,
            new HierarchyLevel(1, ["h1", "h2", "h3a"])
          );
        });

        it(`THEN include 'h1.*.h3a' label`, () => {
          expect(
            schemaCandidates.some((cand) => cand.label === "h1.*.h3a")
          ).toBeTruthy();
        });
      });
    });
  });

  describe(`UserQueries tests`, () => {
    let ONE_SCHEMA_CAND: SchemaCandidate[];
    let TWO_SCHEMA_CAND: SchemaCandidate[];
    beforeEach(async () => {
      ONE_SCHEMA_CAND = await createSchemaCandidates(["1"]);
      TWO_SCHEMA_CAND = await createSchemaCandidates(["1", "2"]);
    });

    describe(`haveUserPickSchemaFileName tests:`, () => {
      it(`WHEN user picked non existent name THEN prompt use the name`, async () => {
        runTestWithInlineSchemaSetup(async ({ vaults }) => {
          const vault: DVault = vaults[0];
          sinon
            .stub(VSCodeUtils, "showInputBox")
            .onFirstCall()
            .returns(Promise.resolve("happy"));

          const actual = await UserQueries.haveUserPickSchemaFileName(
            new HierarchyLevel(1, ["languages", "python", "data"]),
            vault
          );

          expect(actual).toEqual("happy");
        });
      });

      it(`WHEN user picked pre existing name THEN prompt again`, async () => {
        runTestWithInlineSchemaSetup(async ({ vaults }) => {
          const vault: DVault = vaults[0];
          sinon
            .stub(VSCodeUtils, "showInputBox")
            .onFirstCall()
            // 'inlined' already exists.
            .returns(Promise.resolve("inlined"))
            .returns(Promise.resolve("happy"));

          const actual = await UserQueries.haveUserPickSchemaFileName(
            TEST_HIERARCHY_LVL,
            vault
          );

          expect(actual).toEqual("happy");
        });
      });
    });

    describe(`haveUserSelectHierarchyLevel tests:`, () => {
      beforeEach(() => {
        sinon
          .stub(VSCodeUtils, "showQuickPick")
          .returns(Promise.resolve(TEST_HIERARCHY_LVL));
      });

      it(`WHEN happy input THEN return user picked hierarchy level`, () => {
        runTestWithInlineSchemaSetup(async () => {
          const actual = await UserQueries.haveUserSelectHierarchyLevel(
            "/tmp/languages.python.data.md"
          );

          expect(actual).toEqual(TEST_HIERARCHY_LVL);
        });
      });

      it(`WHEN hierarchy depth of current file is too small THEN undefined`, () => {
        runTestWithInlineSchemaSetup(async () => {
          const actual = await UserQueries.haveUserSelectHierarchyLevel(
            "/tmp/languages.data.md"
          );

          expect(actual).toEqual(undefined);
        });
      });

      it(`WHEN top id is already used by existing schema THEN undefined`, () => {
        runTestWithInlineSchemaSetup(async () => {
          const actual = await UserQueries.haveUserSelectHierarchyLevel(
            "/tmp/daily.python.data.md"
          );

          expect(actual).toEqual(undefined);
        });
      });
    });

    describe(`hasSelected tests:`, () => {
      it(`WHEN curr is greater than prev THEN true`, async () => {
        expect(
          UserQueries.hasSelected(ONE_SCHEMA_CAND, TWO_SCHEMA_CAND)
        ).toEqual(true);
      });

      it(`WHEN curr is equal to prev THEN false`, async () => {
        expect(
          UserQueries.hasSelected(ONE_SCHEMA_CAND, ONE_SCHEMA_CAND)
        ).toEqual(false);
      });

      it(`WHEN curr is less than prev THEN false`, async () => {
        expect(
          UserQueries.hasSelected(TWO_SCHEMA_CAND, ONE_SCHEMA_CAND)
        ).toEqual(false);
      });
    });

    describe(`hasUnselected tests:`, () => {
      it("WHEN curr is greater thhan prev THEN false", () => {
        expect(
          UserQueries.hasUnselected(ONE_SCHEMA_CAND, TWO_SCHEMA_CAND)
        ).toEqual(false);
      });

      it(`WHEN curr is equal to prev THEN false`, async () => {
        expect(
          UserQueries.hasUnselected(ONE_SCHEMA_CAND, ONE_SCHEMA_CAND)
        ).toEqual(false);
      });

      it(`WHEN curr is less than prev THEN true`, async () => {
        expect(
          UserQueries.hasUnselected(TWO_SCHEMA_CAND, ONE_SCHEMA_CAND)
        ).toEqual(true);
      });
    });

    describe(`findUncheckedItem tests:`, () => {
      it(`WHEN unchecked THEN get the candidate`, () => {
        const actual = UserQueries.findUncheckedItem(
          TWO_SCHEMA_CAND,
          ONE_SCHEMA_CAND
        );
        expect(actual.note.fname).toEqual("2");
      });
    });

    describe(`findCheckedItems tests:`, () => {
      it(`WHEN checked THEN get the candidate`, () => {
        const actual = UserQueries.findCheckedItem(
          ONE_SCHEMA_CAND,
          TWO_SCHEMA_CAND
        );
        expect(actual.note.fname).toEqual("2");
      });
    });

    describe(`determineAfterSelect tests:`, () => {
      describe(`WHEN a child of non selected hierarchy is checked`, () => {
        let actual: SchemaCandidate[];

        beforeEach(async () => {
          const all = await createSchemaCandidates([
            "h1.h2",
            "h1.h2.h3a",
            "h1.h2.h3b",
            "h1.h2.h3c",
            "h1.h2.h3c.h4",
            "otherHierarchy.h2",
          ]);

          const prev = await createSchemaCandidates(["otherHierarchy.h2"]);

          const curr = await createSchemaCandidates([
            "otherHierarchy.h2",
            "h1.h2.h3c.h4",
          ]);

          actual = UserQueries.determineAfterSelect(prev, curr, all);
        });

        it(`THEN make sure length is as expected`, () => {
          expect(actual.length).toEqual(4);
        });

        it("THEN retain the checked items", () => {
          expect(
            actual.some((c) => c.note.fname === "otherHierarchy.h2")
          ).toBeTruthy();
          expect(actual.some((c) => c.note.fname === "h1.h2.h3c")).toBeTruthy();
        });

        it(`THEN select parent of item`, () => {
          expect(actual.some((c) => c.note.fname === "h1.h2.h3c")).toBeTruthy();
        });

        it(`THEN select grand-parent (ancestor) of item`, () => {
          expect(actual.some((c) => c.note.fname === "h1.h2")).toBeTruthy();
        });
      });
    });

    describe(`determineAfterUnselect tests:`, () => {
      describe(`WHEN ancestor is unchecked`, () => {
        let actual: SchemaCandidate[];

        beforeEach(async () => {
          const prev = await createSchemaCandidates([
            "h1.h2",
            "h1.h2.h3a",
            "h1.h2.h3c.h4",
            "otherHierarchy.h2",
          ]);

          const curr = await createSchemaCandidates([
            "h1.h2.h3a",
            "h1.h2.h3c.h4",
            "otherHierarchy.h2",
          ]);

          actual = UserQueries.determineAfterUnselect(prev, curr);
        });

        it(`THEN keep another hierarchy as is`, () => {
          expect(
            actual.some((c) => c.note.fname === "otherHierarchy.h2")
          ).toBeTruthy();
        });

        it(`THEN unselect all the descendents`, () => {
          expect(actual.length).toEqual(1);
        });
      });
    });
  });
});
