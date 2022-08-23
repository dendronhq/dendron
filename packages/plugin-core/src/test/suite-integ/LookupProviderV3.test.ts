import {
  asyncLoopOneAtATime,
  NoteProps,
  NoteUtils,
} from "@dendronhq/common-all";
import { NoteTestUtilsV4, TestNoteFactory } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS, TestEngineUtils } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { beforeEach, describe, it, suite } from "mocha";
import sinon from "sinon";
import { ExtensionContext, Selection } from "vscode";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";
import {
  shouldBubbleUpCreateNew,
  sortBySimilarity,
} from "../../components/lookup/utils";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";

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
        const editor = await WSUtils.openNote(active);
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

        cmd.cleanUp();
      });

      test("THEN quickpick is populated with normal query results.", async () => {
        const editor = await WSUtils.openNote(active);
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

        cmd.cleanUp();
      });

      test("THEN if selected wikilink's vault is ambiguous, list all notes with same fname across all vaults.", async () => {
        const editor = await WSUtils.openNote(activeWithAmbiguousLink);
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

        cmd.cleanUp();
      });

      test("THEN if selection contains links that point to same note, correctly dedupes them", async () => {
        const editor = await WSUtils.openNote(activeWithNonUniqueLinks);
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

        cmd.cleanUp();
      });
    }
  );
});

suite("onAccept", () => {
  describeMultiWS(
    "GIVEN invalid fname",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN rejected", async () => {
        const validateFnameSpy = sinon.spy(NoteUtils, "validateFname");
        const cmd = new NoteLookupCommand();
        const { controller, provider, quickpick } = await cmd.gatherInputs();
        const invalidFnames = [
          "foo.", // trailing dot
          "foo..", // multiple trailing dots
          ".foo", // leading dot
          "..foo", // multiple leading dots
          " foo", // leading whitespace
          "  foo", // multiple leading whitespace
          "foo ", // trailing whitespace
          "foo  ", // multiple trailing whitespace
          " foo ", // leading and trailing whitespace
          "  foo  ", // multiple leading and trailing whitespace
          "foo..bar", // empty hierarchy
          "foo...bar", // multiple empty hierarchy
          "foo. .bar", // whitespace hierarchy
          "foo.bar .baz", // hierarchy with trailing whitespace
          "foo. bar.baz", // hierarchy with leading whitespace
          "foo. bar .baz", // hierarchy with leading and trailing whitespace
          " foo . . bar . . baz ", // everything
        ];

        await asyncLoopOneAtATime(invalidFnames, async (fname) => {
          quickpick.value = fname;
          await provider.onDidAccept({
            quickpick,
            cancellationToken: controller.cancelToken,
          })();
          const lastCall = validateFnameSpy.lastCall;
          expect(lastCall.args[0]).toEqual(fname);
          expect(lastCall.returnValue).toBeFalsy();
        });
        cmd.cleanUp();
        validateFnameSpy.restore();
      });
    }
  );
  describeMultiWS(
    "GIVEN a note with invalid name that already exists",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          vault: vaults[0],
          wsRoot,
          fname: "foo. bar.baz",
          body: "note with invalid name",
          genRandomId: true,
        });
      },
      timeout: 5e3,
    },
    () => {
      test("THEN accept lookup", async () => {
        await VSCodeUtils.closeAllEditors();
        const cmd = new NoteLookupCommand();
        const { provider } = await cmd.gatherInputs();
        const note = (
          await ExtensionProvider.getEngine().findNotes({
            fname: "foo. bar.baz",
          })
        )[0];
        const item = {
          ...note,
          label: "foo. bar.baz",
          detail: "",
          alwaysShow: true,
        };
        const out = provider.shouldRejectItem!({ item });
        expect(out).toBeFalsy();
        cmd.cleanUp();
      });
    }
  );
  describeMultiWS(
    "GIVEN a new item with invalid name",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN reject lookup", async () => {
        await VSCodeUtils.closeAllEditors();
        const cmd = new NoteLookupCommand();
        const { provider } = await cmd.gatherInputs();
        const { vaults, wsRoot } = ExtensionProvider.getDWorkspace();
        const note = await NoteTestUtilsV4.createNote({
          vault: vaults[0],
          wsRoot,
          fname: "foo. bar.baz",
          body: "note with invalid name",
          genRandomId: true,
        });
        const item = {
          ...note,
          label: "Create New",
          detail: "Note does not exist. Create?",
          alwaysShow: true,
        };
        const out = provider.shouldRejectItem!({ item });
        expect(out).toBeTruthy();
        cmd.cleanUp();
      });
    }
  );
});
