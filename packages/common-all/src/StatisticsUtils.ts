/**
 * Utility class for _very simple_ statistics operations.
 * When we need to do complex and/or expensive stats,
 * consider introducing a dedicated stats library.
 *
 * This is here to use until that point comes
 */

import _ from "lodash";
import { DendronError } from ".";

export class StatisticsUtils {
  /**
   * Get standard deviation from array of numbers.
   */
  static stddev(arr: number[]) {
    if (arr.length === 0) {
      throw new DendronError({
        message: "Cannot calculate standard deviation of empty array.",
      });
    }
    const population = arr.length;
    const mean = _.mean(arr);
    const deviations = arr.map((value) => value - mean);
    const powers = deviations.map((value) => value ** 2);
    const variance = _.sum(powers) / population;
    return Math.sqrt(variance);
  }

  /**
   * Get median value from array of numbers.
   */
  static median(arr: number[]) {
    if (arr.length === 0) {
      throw new DendronError({
        message: "Cannot calculate median of empty array.",
      });
    }
    const population = arr.length;
    const mid = Math.floor(population / 2);
    const sorted = [...arr].sort((a, b) => a - b);
    return population % 2 ? sorted[mid] : (sorted[mid] + sorted[mid - 1]) / 2;
  }
}
