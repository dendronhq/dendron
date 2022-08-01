/**
 * Utility class for _very simple_ statistics operations.
 * When we need to do complex and/or expensive stats,
 * consider introducing a dedicated stats library.
 *
 * This is here to use until that point comes
 */

import _ from "lodash";
import { DNodeUtils, NoteProps } from ".";

export type NonEmptyArray<T> = [T, ...T[]];

export class StatisticsUtils {
  static isNonEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
    return arr.length > 0;
  }

  static getBasicStats(arr: NonEmptyArray<number>) {
    return {
      mean: _.mean(arr),
      median: StatisticsUtils.median(arr),
      stddev: StatisticsUtils.stddev(arr),
      max: _.max(arr),
    };
  }

  /**
   * Get standard deviation from array of numbers.
   */
  static stddev(arr: NonEmptyArray<number>): number {
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
  static median(arr: NonEmptyArray<number>): number {
    const population = arr.length;
    const mid = Math.floor(population / 2);
    const sorted = [...arr].sort((a, b) => a - b);
    return population % 2 ? sorted[mid] : (sorted[mid] + sorted[mid - 1]) / 2;
  }

  /**
   * Convenience command to grab a collection of statistics from a set of notes.
   *
   * Given an array of notes, aggregate and get basic statistics of the following:
   *
   * number of children,
   * number of links,
   * number of characters in body,
   * note depth
   *
   * This is used to grab statistics about quantifiable properties from a set of notes
   * for analytics purposes.
   *
   * @param notes Notes to get basic stats from
   * @returns an object holding all basic stats
   */
  static getBasicStatsFromNotes(notes: NoteProps[]) {
    // accumulate values from all notes.
    const numChildrenAcc = notes.map((note) => note.children.length);
    const numLinksAcc = notes.map((note) => note.links.length);
    const numCharsAcc = notes.map((note) => note.body.length);
    const noteDepthAcc = notes.map((note) => DNodeUtils.getDepth(note));

    // make sure they are nonempty arrays.
    if (
      !StatisticsUtils.isNonEmptyArray(numChildrenAcc) ||
      !StatisticsUtils.isNonEmptyArray(numLinksAcc) ||
      !StatisticsUtils.isNonEmptyArray(numCharsAcc) ||
      !StatisticsUtils.isNonEmptyArray(noteDepthAcc)
    ) {
      // this should never be the case, but we need to do this
      // because typescript can't infer that.
      return;
    }

    const {
      mean: numChildren,
      median: medianNumChildren,
      stddev: stddevNumChildren,
      max: maxNumChildren,
    } = StatisticsUtils.getBasicStats(numChildrenAcc);

    const {
      mean: numLinks,
      median: medianNumLinks,
      stddev: stddevNumLinks,
      max: maxNumLinks,
    } = StatisticsUtils.getBasicStats(numLinksAcc);

    const {
      mean: numChars,
      median: medianNumChars,
      stddev: stddevNumChars,
      max: maxNumChars,
    } = StatisticsUtils.getBasicStats(numCharsAcc);

    const {
      mean: noteDepth,
      median: medianNoteDepth,
      stddev: stddevNoteDepth,
      max: maxNoteDepth,
    } = StatisticsUtils.getBasicStats(noteDepthAcc);

    return {
      numChildren,
      numLinks,
      numChars,
      noteDepth,
      maxNumChildren,
      medianNumChildren,
      stddevNumChildren,
      maxNumLinks,
      medianNumLinks,
      stddevNumLinks,
      maxNumChars,
      medianNumChars,
      stddevNumChars,
      maxNoteDepth,
      medianNoteDepth,
      stddevNoteDepth,
    };
  }
}
