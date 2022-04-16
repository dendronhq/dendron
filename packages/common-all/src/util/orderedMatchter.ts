/** Object with responsibility to match strings with the given order. */
export class OrderedMatcher {
  private regexPattern: string;

  constructor(tokens: string[]) {
    // https://regex101.com/r/eMTNJ0/1
    this.regexPattern = tokens.join(".*").toLowerCase();
  }

  /** Checks whether the given strings matches all the tokens in order. */
  isMatch(str: string) {
    const isMatch = str.toLowerCase().match(this.regexPattern);
    return isMatch;
  }
}
