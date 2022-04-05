import { AsyncUtils, ErrorUtils } from "@dendronhq/common-all";

describe("GIVEN AsyncUtils.awaitWithLimit", () => {
  describe("WHEN cb takes longer than limit", () => {
    it("THEN return error", async () => {
      const resp = await AsyncUtils.awaitWithLimit({ limitMs: 100 }, () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(true), 200);
        });
      });
      expect(ErrorUtils.isErrorResp(resp)).toBeTruthy();
    });
  });
  describe("WHEN cb takes shorter than limit", () => {
    it("THEN retrun result", async () => {
      const resp = await AsyncUtils.awaitWithLimit({ limitMs: 100 }, () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(true), 50);
        });
      });
      expect(ErrorUtils.isErrorResp(resp)).toBeFalsy();
      expect(resp.data).toEqual(true);
    });
  });
});
