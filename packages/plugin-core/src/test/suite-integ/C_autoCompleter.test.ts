/**
 * File has C_ prefix to move it down in the list of tests.
 * If C_ is removed it bubbles up to the top of the tests and for some reason
 * just using 'expect' starts to trigger the following error:
 * ```
 * Cmd is not a constructor: TypeError: Cmd is not a constructor
 *   at /usr/local/workplace/dendron/packages/plugin-core/out/src/workspace.js:476:25
 * ```
 * Moving the test down in the order of tests appears to resolve this error.
 * */
import { AutoCompleter } from "../../utils/autoCompleter";
import { describe, it } from "mocha";
import { expect } from "../testUtilsv2";

describe(`Auto Completer tests.`, () => {
  describe(`GIVEN empty file name input`, () => {
    it(`WHEN auto complete is used with empty file names THEN return current value`, () => {
      expect(AutoCompleter.autoCompleteNoteLookup("hello", [])).toEqual(
        "hello"
      );
    });
  });

  describe(`GIVEN "language" file name input:`, () => {
    const LANGUAGE_FNAMES = [
      "languages.python.data",
      "languages.python.data.string",
      "languages.with-data.make-sense",
      "languages.python.data.string",
      "languages.python.machine-learning.pandas",
      "languages.python.data.bool",
      "languages.python.data",
      "languages.python",
      "languages.with-data",
      // Note that this one starts with 'langrel' instead of language.
      "langrel.hello-world",
    ];

    function testWithLanguageInput(input: string, expected: string) {
      const actual = AutoCompleter.autoCompleteNoteLookup(
        input,
        LANGUAGE_FNAMES
      );
      expect(actual).toEqual(expected);
    }

    describe(`Testing prefix auto completion (digging into hierarchy):`, () => {
      [
        ["lang", "languages"],
        ["languages", "languages.python"],
        ["languages.py", "languages.python"],
        ["languages.python", "languages.python.data"],
        ["languages.python.da", "languages.python.data"],
        // This is an important test case since it goes from first filename result to
        // second top pick file name result.
        ["languages.python.data", "languages.python.data.string"],
      ].forEach((testCase) => {
        const input = testCase[0];
        const expected = testCase[1];

        it(`WHEN '${input}' THEN expect: '${expected}'`, () => {
          testWithLanguageInput(input, expected);
        });
      });
    });

    describe(`Testing completion within the note`, () => {
      it(`WHEN matching 'pyth' THEN we should prepend the beginning of top pick`, () => {
        testWithLanguageInput("pyth", "languages.pyth");
      });
    });

    describe(`Testing unmatched`, () => {
      it("WHEN unmatched is attempted to auto complete THEN top pick return", () => {
        testWithLanguageInput("i-dont-match", "languages.python.data");
      });
    });

    describe(`Testing query characters`, () => {
      it("WHEN query characters are used THEN return top pick", () => {
        testWithLanguageInput("pyt hon", "languages.python.data");
      });
    });
  });
});
