import { DendronServerError } from "@dendronhq/common-all";
import _ from "lodash";
import SparkMD5 from "spark-md5";

/** One group in an A/B test. Describes one group of users. */
type ABTestGroup<GroupNames> = {
  /** Name for the group. */
  name: GroupNames;
  /** The likelihood of a user to be in this group. The number should be
   * positive and nonzero. The weight is calculated in relation to the weight of other groups
   * in the A/B test. */
  weight: number;
};

const MAX_B16_INT = 0xffffffff;

/** One A/B test.
 *
 * Warning! Test names **must** stay consistent between Dendron releases, or
 * users will see the tests flip/flop.
 *
 * Can test two or more groups.
 *
 * ```ts
 * const EXAMPLE_TEST = new ABTest("example", [
 *   {
 *     name: "user with example",
 *     weight: 2,
 *   },
 *   {
 *     name: "users without example",
 *     weight: 1,
 *   },
 * ]);
 *
 * EXAMPLE_TEST.getUserGroup("anonymous user UUID");
 * ```
 CURRENT_AB_TESTS|* ^85lbm3148c1a
 */
export class ABTest<GroupNames> {
  private _name: string;
  public get name(): string {
    return this._name;
  }
  private groups: ABTestGroup<GroupNames>[];

  constructor(name: string, groups: ABTestGroup<GroupNames>[]) {
    this._name = name;

    if (groups.length < 2)
      throw new DendronServerError({
        message:
          "An A/B test is created with less than 2 groups. Each test must have at least 2.",
      });

    const sumWeights = _.sumBy(groups, (group) => group.weight);
    this.groups = groups.map((group) => {
      return { ...group, weight: group.weight / sumWeights };
    });
  }

  /** Given the user ID, find which group of the AB test the user belongs to. */
  public getUserGroup(userId: string) {
    const hash = SparkMD5.hash(`${this._name}:${userId}`);
    const hashedInt = parseInt(`0x${hash.slice(0, 8)}`, 16);
    const userRandom = hashedInt / MAX_B16_INT;

    // add up group weights until we hit the user random
    let accum = 0;
    for (const group of this.groups) {
      accum += group.weight;

      // once we're above the user's random threshold, the user is in this group
      if (userRandom <= accum) {
        return group.name;
      }
    }
    return this.groups[this.groups.length - 1].name;
  }
}
