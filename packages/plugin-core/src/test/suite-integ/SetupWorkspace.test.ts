import * as assert from "assert";
import { afterEach, before, beforeEach, describe, it } from "mocha";

suite("startup", function () {
  describe("foo", function () {
    it("sanity", function () {
      assert.strictEqual(1, 1);
    });
  });
});
