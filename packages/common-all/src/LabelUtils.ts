import { DateTime } from "luxon";

export type DendronLabel = {
  value: string;
};
export const DENDRON_LABELS = new Map<string, DendronLabel>([]);

/**
 * Simple utility class for generating labels with a time constrained _highlight_
 * Use it to give a certain label that is exposed in the UI some highlighting text
 * for a short amount of time.
 *
 * TODO: Depending on the usage, make this a service that can be
 * generally used to provide all public facing UI text
 * TODO: Make this a central place to manage all labels and their durations
 * TODO: Consolidate all constants defined across our codebase here.
 */
export class LabelUtils {
  static createLabelWithHighlight(opts: {
    value: string;
    highlight: {
      value: string;
      location: "prefix" | "suffix";
      expirationTime: DateTime;
    };
  }) {
    const { value, highlight } = opts;
    let prefix = "";
    let suffix = "";
    const shouldHighlight =
      highlight.expirationTime.diffNow().as("milliseconds") > 0;
    if (shouldHighlight) {
      if (highlight.location === "prefix") {
        prefix = `${highlight.value} `;
      }
      if (highlight.location === "suffix") {
        suffix = ` ${highlight.value}`;
      }
    }
    const out = `${prefix}${value}${suffix}`;
    return out;
  }
}
