import { beforeEach, describe, it, suite } from "mocha";
import { expect } from "../testUtilsv2";
import {
  shouldBubbleUpCreateNew,
  sortBySimilarity,
} from "../../components/lookup/LookupProviderV3";
import { NoteTestUtilsV4, TestNoteFactory } from "@dendronhq/common-test-utils";
import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";
import { ExtensionContext, Selection } from "vscode";
import { TestEngineUtils, ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { VSCodeUtils } from "../../utils";
import { NoteProps } from "@dendronhq/common-all";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";
import _ from "lodash";

suite("LookupProviderV3 utility methods:", () => {
  describe(`shouldBubbleUpCreateNew`, () => {
    describe(`WHEN no special characters and no exact matches`, () => {
      let querystring: string;
      let numberOfExactMatches: number;

      beforeEach(() => {
        querystring = "simple-query-no-special-chars";
        numberOfExactMatches = 0;
      });

      it(`AND bubble up is omitted THEN bubble up`, () => {
        expect(
          shouldBubbleUpCreateNew({ querystring, numberOfExactMatches })
        ).toBeTruthy();

        expect(
          shouldBubbleUpCreateNew({
            querystring,
            numberOfExactMatches,
            bubbleUpCreateNew: undefined,
          })
        ).toBeTruthy();
      });

      it("AND bubble up is set to false THEN do NOT bubble up", () => {
        const actual = shouldBubbleUpCreateNew({
          querystring,
          numberOfExactMatches,
          bubbleUpCreateNew: false,
        });
        expect(actual).toBeFalsy();
      });

      it("AND bubble up is set to true THEN bubble up", () => {
        const actual = shouldBubbleUpCreateNew({
          querystring,
          numberOfExactMatches,
          bubbleUpCreateNew: true,
        });
        expect(actual).toBeTruthy();
      });
    });

    it(`WHEN special char is used THEN do NOT bubble up`, () => {
      const actual = shouldBubbleUpCreateNew({
        querystring: "query with space",
        numberOfExactMatches: 0,
      });
      expect(actual).toBeFalsy();
    });

    it(`WHEN number of exact matches is more than 0 THEN do NOT bubble up`, () => {
      const actual = shouldBubbleUpCreateNew({
        querystring: "query-val",
        numberOfExactMatches: 1,
      });
      expect(actual).toBeFalsy();
    });
  });

  describe(`sortBySimilarity`, () => {
    it("WHEN notes out of order THEN sort by similarity", async () => {
      const noteFactory = TestNoteFactory.defaultUnitTestFactory();

      const notes = [
        await noteFactory.createForFName("pkg.hi.components"),
        await noteFactory.createForFName("pkg.hi.arch"),
        await noteFactory.createForFName("pkg.hi.quickstart"),
      ];

      const sorted = sortBySimilarity(notes, "pkg.hi.arc");
      expect(sorted.map((sorted) => sorted.fname)).toEqual([
        "pkg.hi.arch",
        "pkg.hi.quickstart",
        "pkg.hi.components",
      ]);
    });
  });
});

suite("selection2Items", () => {
  const ctx: ExtensionContext = setupBeforeAfter(this, {
    noSetTimeout: true,
  });
  let active: NoteProps;
  let activeWithAmbiguousLink: NoteProps;
  let activeWithNonUniqueLinks: NoteProps;
  describeMultiWS(
    "GIVEN an active note with selection that contains wikilinks",
    {
      ctx,
      preSetupHook: async ({ vaults, wsRoot }) => {
        await ENGINE_HOOKS.setupBasic({ vaults, wsRoot });
        active = await NoteTestUtilsV4.createNote({
          vault: TestEngineUtils.vault1(vaults),
          wsRoot,
          fname: "active",
          body: "[[dendron.ginger]]\n[[dendron.dragonfruit]]\n[[dendron.clementine]]",
        });
        activeWithAmbiguousLink = await NoteTestUtilsV4.createNote({
          vault: TestEngineUtils.vault1(vaults),
          wsRoot,
          fname: "active-ambiguous",
          body: "[[pican]]",
        });
        activeWithNonUniqueLinks = await NoteTestUtilsV4.createNote({
          vault: TestEngineUtils.vault1(vaults),
          wsRoot,
          fname: "active-dedupe",
          body: "[[dendron.ginger]]\n\n[[Ginger|dendron.ginger]]\n\n[[Lots of Ginger|dendron.ginger]]\n\n",
        });
        await NoteTestUtilsV4.createNote({
          genRandomId: true,
          vault: TestEngineUtils.vault2(vaults),
          wsRoot,
          fname: "pican",
          body: "",
        });
        await NoteTestUtilsV4.createNote({
          genRandomId: true,
          vault: TestEngineUtils.vault3(vaults),
          wsRoot,
          fname: "pican",
          body: "",
        });
        await NoteTestUtilsV4.createNote({
          vault: TestEngineUtils.vault1(vaults),
          wsRoot,
          fname: "dendron.ginger",
          body: "",
        });
        await NoteTestUtilsV4.createNote({
          vault: TestEngineUtils.vault1(vaults),
          wsRoot,
          fname: "dendron.dragonfruit",
          body: "",
        });
        await NoteTestUtilsV4.createNote({
          vault: TestEngineUtils.vault1(vaults),
          wsRoot,
          fname: "dendron.clementine",
          body: "",
        });
      },
    },
    () => {
      test("THEN quickpick is populated with notes that were selected.", async () => {
        const editor = await VSCodeUtils.openNote(active);
        editor.selection = new Selection(7, 0, 10, 0);

        const cmd = new NoteLookupCommand();
        const gatherOut = await cmd.gatherInputs({
          selectionType: "selection2Items",
          initialValue: "",
          noConfirm: true,
        });

        const enrichOut = await cmd.enrichInputs(gatherOut);

        expect(
          !_.isUndefined(gatherOut.quickpick.itemsFromSelection)
        ).toBeTruthy();
        const expectedItemLabels = [
          "dendron.ginger",
          "dendron.dragonfruit",
          "dendron.clementine",
        ];

        const actualItemLabels = enrichOut?.selectedItems.map(
          (item) => item.label
        );

        expect(expectedItemLabels).toEqual(actualItemLabels);
      });

      test("THEN quickpick is populated with normal query results.", async () => {
        const editor = await VSCodeUtils.openNote(active);
        editor.selection = new Selection(7, 0, 10, 0);

        const cmd = new NoteLookupCommand();
        const gatherOut = await cmd.gatherInputs({
          noConfirm: true,
          initialValue: "",
        });

        const enrichOut = await cmd.enrichInputs(gatherOut);
        const expectedItemLabels = [
          "root",
          "root",
          "root",
          "active-ambiguous",
          "active-dedupe",
          "active",
          "bar",
          "foo",
          "pican",
          "dendron",
          "pican",
        ];

        expect(
          _.isUndefined(gatherOut.quickpick.itemsFromSelection)
        ).toBeTruthy();

        const actualItemLabels = enrichOut?.selectedItems.map(
          (item) => item.label
        );
        expect(expectedItemLabels.sort()).toEqual(actualItemLabels?.sort());
      });

      test("THEN if selected wikilink's vault is ambiguous, list all notes with same fname across all vaults.", async () => {
        const editor = await VSCodeUtils.openNote(activeWithAmbiguousLink);
        editor.selection = new Selection(7, 0, 8, 0);

        const cmd = new NoteLookupCommand();
        const gatherOut = await cmd.gatherInputs({
          noConfirm: true,
          selectionType: "selection2Items",
          initialValue: "",
        });

        const enrichOut = await cmd.enrichInputs(gatherOut);
        const expectedItemLabels = ["pican", "pican"];

        expect(
          !_.isUndefined(gatherOut.quickpick.itemsFromSelection)
        ).toBeTruthy();

        const actualItemLabels = enrichOut?.selectedItems.map(
          (item) => item.label
        );

        expect(expectedItemLabels).toEqual(actualItemLabels);
      });

      test("THEN if selection contains links that point to same note, correctly dedupes them", async () => {
        const editor = await VSCodeUtils.openNote(activeWithNonUniqueLinks);
        editor.selection = new Selection(7, 0, 10, 0);

        const cmd = new NoteLookupCommand();
        const gatherOut = await cmd.gatherInputs({
          noConfirm: true,
          selectionType: "selection2Items",
          initialValue: "",
        });

        const enrichOut = await cmd.enrichInputs(gatherOut);
        const expectedItemLabels = ["dendron.ginger"];

        expect(
          !_.isUndefined(gatherOut.quickpick.itemsFromSelection)
        ).toBeTruthy();

        const actualItemLabels = enrichOut?.selectedItems.map(
          (item) => item.label
        );

        expect(expectedItemLabels).toEqual(actualItemLabels);
      });
    }
  );
});
