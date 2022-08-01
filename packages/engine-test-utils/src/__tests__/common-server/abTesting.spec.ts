import { ABTest, DefaultMap, genUUID } from "@dendronhq/common-all";
import _ from "lodash";

// To make checks more accurate, make FLOAT_SAME smaller and LOOP much larger.
// The tests to pass when the accuracy is higher, they just take longer.
const FLOAT_SAME = 0.05; // accurate to 1 percent
const LOOP = 20000;

function estimateABTestOutcomes<Out>(test: ABTest<Out>): Map<Out, number> {
  const foundCount = new DefaultMap<Out, number>(() => 0);

  let i = 0;
  // eslint-disable-next-line no-plusplus
  for (; i < LOOP; i++) {
    const group = test.getUserGroup(genUUID());
    foundCount.set(group, foundCount.get(group) + 1);
  }

  const sum = _.sum([...foundCount.values()]);
  return new Map(
    [...foundCount.entries()].map(([group, count]) => [group, count / sum])
  );
}

/** Returns true if both floats are approximately equal. */
export function checkFloatEquals(
  left: number,
  right: number,
  accept: number = FLOAT_SAME
) {
  return Math.abs(left - right) < accept;
}

describe("GIVEN ABTest", () => {
  describe("WHEN the same user is checked for the same test multiple times", () => {
    test("THEN they get the same group every time", () => {
      const userId = genUUID();
      const abTest = new ABTest("abtest", [
        {
          name: "left",
          weight: 1,
        },
        {
          name: "right",
          weight: 1,
        },
      ]);
      const first = abTest.getUserGroup(userId);
      // Repeating this a few times to make sure we always get the same outcome
      expect(abTest.getUserGroup(userId)).toEqual(first);
      expect(abTest.getUserGroup(userId)).toEqual(first);
      expect(abTest.getUserGroup(userId)).toEqual(first);
      expect(abTest.getUserGroup(userId)).toEqual(first);
      expect(abTest.getUserGroup(userId)).toEqual(first);
    });
  });

  describe("WHEN there are 2 groups of equal weight", () => {
    test("THEN the groups will appear approximately equally", () => {
      const estimates = estimateABTestOutcomes(
        new ABTest("abtest", [
          {
            name: "left",
            weight: 1,
          },
          {
            name: "right",
            weight: 1,
          },
        ])
      );

      expect(checkFloatEquals(estimates.get("left")!, 0.5)).toBeTruthy();
      expect(checkFloatEquals(estimates.get("right")!, 0.5)).toBeTruthy();
    });
  });

  describe("WHEN there are 2 groups of differing weights", () => {
    test("THEN that group will appear more often", () => {
      const estimates = estimateABTestOutcomes(
        new ABTest("abtest", [
          {
            name: "left",
            weight: 3,
          },
          {
            name: "right",
            weight: 1,
          },
        ])
      );

      expect(checkFloatEquals(estimates.get("left")!, 0.75)).toBeTruthy();
      expect(checkFloatEquals(estimates.get("right")!, 0.25)).toBeTruthy();
    });
  });

  describe("WHEN there are 3 groups of equal weight", () => {
    test("THEN the groups will appear approximately equally", () => {
      const estimates = estimateABTestOutcomes(
        new ABTest("abtest", [
          {
            name: "left",
            weight: 1,
          },
          {
            name: "middle",
            weight: 1,
          },
          {
            name: "right",
            weight: 1,
          },
        ])
      );

      expect(checkFloatEquals(estimates.get("left")!, 0.333)).toBeTruthy();
      expect(checkFloatEquals(estimates.get("middle")!, 0.333)).toBeTruthy();
      expect(checkFloatEquals(estimates.get("right")!, 0.333)).toBeTruthy();
    });
  });
});
