import { NullCache } from "@dendronhq/common-all";

describe("NullCache tests", () => {
  describe("GIVEN null cache", () => {
    const nullCache = new NullCache();

    it("WHEN get item that was just set THEN return undefined", () => {
      nullCache.set(1, 1);

      expect(nullCache.get(1)).toBeUndefined();
    });
  });
});
