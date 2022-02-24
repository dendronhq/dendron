import { describe } from "mocha";
import { AnalyticsUtils } from "../../utils/analytics";
import { expect } from "../expect";

describe("GIVEN AnalyticsUtils", () => {
  describe("AND WHEN getSessionId called twice", () => {
    test("THEN get same value", () => {
      const val1 = AnalyticsUtils.getSessionId();
      const val2 = AnalyticsUtils.getSessionId();
      expect(val1).toNotEqual(-1);
      expect(val1).toEqual(val2);
    });
  });
});
