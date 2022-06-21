import { DendronError, StatisticsUtils } from "@dendronhq/common-all";
import { describe } from "mocha";
import { expect } from "../testUtilsv2";

suite("StatisticsUtils", function () {
  describe("stddev", () => {
    describe("given an array of numbers", () => {
      test("correctly outputs standard deviation", () => {
        const arr = [1, 2, 3, 4, 5];
        const expected = Math.sqrt(2);
        const actual = StatisticsUtils.stddev(arr);
        expect(actual).toEqual(expected);

        const arr2 = [1, 2, 3, 4, 5, 6];
        const expected2 = Math.sqrt(17.5 / 6);
        const actual2 = StatisticsUtils.stddev(arr2);
        expect(actual2).toEqual(expected2);
      });
    });

    describe("given an empty array", () => {
      test("throws error", () => {
        const arr: number[] = [];
        let errorThrown = false;
        try {
          StatisticsUtils.stddev(arr);
        } catch (error) {
          errorThrown = true;
          const isDendronError = DendronError.isDendronError(error);
          expect(isDendronError).toBeTruthy();
          if (isDendronError) {
            expect(error.message).toEqual(
              "Cannot calculate standard deviation of empty array."
            );
          }
        }
        expect(errorThrown).toBeTruthy();
      });
    });
  });

  describe("median", () => {
    describe("given an array of number", () => {
      test("correctly outputs median value", () => {
        const arr = [1, 2, 3, 4, 5];
        const expected = 3;
        const actual = StatisticsUtils.median(arr);
        expect(actual).toEqual(expected);

        const arr2 = [1, 2, 3, 4, 5, 6];
        const expected2 = 3.5;
        const actual2 = StatisticsUtils.median(arr2);
        expect(actual2).toEqual(expected2);
      });
    });

    describe("given an empty array", () => {
      test("throws error", () => {
        const arr: number[] = [];
        let errorThrown = false;
        try {
          StatisticsUtils.median(arr);
        } catch (error) {
          errorThrown = true;
          const isDendronError = DendronError.isDendronError(error);
          expect(isDendronError).toBeTruthy();
          if (isDendronError) {
            expect(error.message).toEqual(
              "Cannot calculate median of empty array."
            );
          }
        }
        expect(errorThrown).toBeTruthy();
      });
    });
  });
});
