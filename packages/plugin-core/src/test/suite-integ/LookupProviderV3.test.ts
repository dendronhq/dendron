import { beforeEach, describe, it, suite } from "mocha";
import { expect } from "../testUtilsv2";
import { shouldBubbleUpCreateNew } from "../../components/lookup/LookupProviderV3";

suite("LookupProviderV3 utility methods:", () => {
  describe(`shouldBubbleUpCreateNew`, () => {
    describe(`WHEN no special characters and no exact matches`, () => {
      let querystring: string;
      let numberOfExactMatches: number;

      beforeEach(() => {
        querystring = "simple-query-no-special-chars";
        numberOfExactMatches = 0;
      });

      it(`AND dont bubble up is omitted THEN bubble up`, () => {
        expect(
          shouldBubbleUpCreateNew({ querystring, numberOfExactMatches })
        ).toBeTruthy();

        expect(
          shouldBubbleUpCreateNew({
            querystring,
            numberOfExactMatches,
            dontBubbleUpCreateNew: undefined,
          })
        ).toBeTruthy();
      });

      it("AND dont bubble up is set to true THEN do NOT bubble up", () => {
        const actual = shouldBubbleUpCreateNew({
          querystring,
          numberOfExactMatches,
          dontBubbleUpCreateNew: true,
        });
        expect(actual).toBeFalsy();
      });

      it("AND dont bubble up is set to false THEN bubble up", () => {
        const actual = shouldBubbleUpCreateNew({
          querystring,
          numberOfExactMatches,
          dontBubbleUpCreateNew: false,
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
});
