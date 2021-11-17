import { beforeEach, describe, it, suite } from "mocha";
import { expect } from "../testUtilsv2";
import {
  shouldBubbleUpCreateNew,
  sortBySimilarity,
} from "../../components/lookup/LookupProviderV3";
import { TestNoteFactory } from "@dendronhq/common-test-utils";

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
