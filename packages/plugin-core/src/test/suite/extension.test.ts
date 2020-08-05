import * as assert from "assert";
import { describe } from "mocha";

suite("startup", function () {
  describe("sanity", function () {
    test("basic", function () {
      assert.equal(1, 1);
    });
  });
});
