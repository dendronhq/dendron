import { OrderedMatcher } from "@dendronhq/common-all";

describe(`OrderedMatcher tests`, () => {
  describe(`WHEN ordered matcher is initialized with ['h1','v1']`, () => {
    let orderedMatcher: OrderedMatcher;

    beforeEach(() => {
      orderedMatcher = new OrderedMatcher(["h1", "v1"]);
    });

    [
      "h1.v1",
      "h1 v1",
      "h1.h3.v1",
      "h1.h2.GG.h3.v1",
      "h1.h2.h3.v1.GG",
      "h1.h3.v1",
      "h1.v1 GG",
    ].forEach((str) => {
      it(`THEN '${str}' should be matched.`, () => {
        expect(orderedMatcher.isMatch(str)).toBeTruthy();
      });
    });

    ["v1.h1", "v1.GG.h1", "v1 h1", "randomString", ""].forEach((str) => {
      it(`THEN '${str}' should NOT be matched.`, () => {
        expect(orderedMatcher.isMatch(str)).toBeFalsy();
      });
    });
  });
});
