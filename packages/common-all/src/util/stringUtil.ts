import levenshtein from "fast-levenshtein";

/**
 * Returns levenshtein distance between the two strings, the higher the number
 * the further apart the strings are. 0 signals that the strings are equal. */
export function levenshteinDistance(s1: string, s2: string): number {
  return levenshtein.get(s1, s2);
}
