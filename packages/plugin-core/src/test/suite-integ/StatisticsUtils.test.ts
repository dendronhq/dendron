import { NonEmptyArray, StatisticsUtils } from "@dendronhq/common-all";
import { describe } from "mocha";
import { expect } from "../testUtilsv2";

suite("StatisticsUtils", function () {
  describe("stddev", () => {
    describe("given an array of numbers", () => {
      test("correctly outputs standard deviation", () => {
        const arr: NonEmptyArray<number> = [1, 2, 3, 4, 5];
        const expected = Math.sqrt(2);
        const actual = StatisticsUtils.stddev(arr);
        expect(actual).toEqual(expected);

        const arr2: NonEmptyArray<number> = [1, 2, 3, 4, 5, 6];
        const expected2 = Math.sqrt(17.5 / 6);
        const actual2 = StatisticsUtils.stddev(arr2);
        expect(actual2).toEqual(expected2);
      });
    });
  });

  describe("median", () => {
    describe("given an array of number", () => {
      test("correctly outputs median value", () => {
        const arr: NonEmptyArray<number> = [1, 2, 3, 4, 5];
        const expected = 3;
        const actual = StatisticsUtils.median(arr);
        expect(actual).toEqual(expected);

        const arr2: NonEmptyArray<number> = [1, 2, 3, 4, 5, 6];
        const expected2 = 3.5;
        const actual2 = StatisticsUtils.median(arr2);
        expect(actual2).toEqual(expected2);
      });
    });
  });

  describe("isNonEmptyArray", () => {
    describe("given a non empty array", () => {
      test("type guard correctly infers that an array is a NonEmptyArray", () => {
        const arr: number[] = [1, 2, 3];
        expect(StatisticsUtils.isNonEmptyArray(arr)).toBeTruthy();
      });
    });
    describe("given an empty array", () => {
      test("type guard correctly infers that an array is not a NonEmptyArray", () => {
        const arr: number[] = [];
        expect(StatisticsUtils.isNonEmptyArray(arr)).toBeFalsy();
      });
    });
  });
});
