import { InvalidFilenameReason, NoteUtils } from "@dendronhq/common-all";
import _ from "lodash";

const validFnames = ["foo", "bar", "foo.bar", "foo bar"];
const invalidFnamesAndReasons = {
  "foo.": InvalidFilenameReason.EMPTY_HIERARCHY,
  "foo..": InvalidFilenameReason.EMPTY_HIERARCHY,
  ".foo": InvalidFilenameReason.EMPTY_HIERARCHY,
  "..foo": InvalidFilenameReason.EMPTY_HIERARCHY,
  " foo": InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
  "  foo": InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
  "foo ": InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
  "foo  ": InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
  " foo ": InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
  "  foo  ": InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
  "foo..bar": InvalidFilenameReason.EMPTY_HIERARCHY,
  "foo...bar": InvalidFilenameReason.EMPTY_HIERARCHY,
  "foo. .bar": InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
  "foo.bar .baz": InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
  "foo. bar.baz": InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
  "foo. bar .baz": InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
  " foo . . bar . . baz ": InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
  "(foo)": InvalidFilenameReason.ILLEGAL_CHARACTER,
  "foo, and bar": InvalidFilenameReason.ILLEGAL_CHARACTER,
  "'foo' and 'bar'": InvalidFilenameReason.ILLEGAL_CHARACTER,
};
const invalidFnamesAndCleaned = {
  "foo.": "foo",
  "foo..": "foo",
  ".foo": "foo",
  "..foo": "foo",
  " foo": "foo",
  "  foo": "foo",
  "foo ": "foo",
  "foo  ": "foo",
  " foo ": "foo",
  "  foo  ": "foo",
  "foo..bar": "foo.bar",
  "foo...bar": "foo.bar",
  "foo. .bar": "foo.bar",
  "foo.bar .baz": "foo.bar.baz",
  "foo. bar.baz": "foo.bar.baz",
  "foo. bar .baz": "foo.bar.baz",
  " foo . . bar . . baz ": "foo.bar.baz",
  "(foo)": "foo",
  "foo, and bar": "foo  and bar",
  "'foo' and 'bar'": "foo  and  bar",
};

describe("NoteUtils", () => {
  describe("validateFname", () => {
    describe("GIVEN valid file names", () => {
      describe("WHEN validated", () => {
        test("THEN correctly validates file name", () => {
          validFnames.forEach((fname) => {
            const resp = NoteUtils.validateFname(fname);
            expect(resp.isValid).toBeTruthy();
            expect(resp.reason).toBeUndefined();
          });
        });
      });
    });
    describe("GIVEN invalid file names", () => {
      describe("WHEN validated", () => {
        test("THEN correctly invalidates file name and return correct reason", () => {
          _.entries(invalidFnamesAndReasons).forEach((item) => {
            const [fname, reason] = item;
            const resp = NoteUtils.validateFname(fname);
            expect(resp.isValid).toBeFalsy();
            expect(resp.reason).toEqual(reason);
          });
        });
      });
    });
  });
  describe("cleanFname", () => {
    describe("GIVEN valid file names", () => {
      describe("WHEN cleaned", () => {
        test("THEN outputs the same file name", () => {
          validFnames.forEach((fname) => {
            const cleanedFname = NoteUtils.cleanFname({
              fname,
            });
            expect(cleanedFname).toEqual(fname);
          });
        });
      });
    });
    describe("GIVEN invalid file names", () => {
      describe("WHEN cleaned", () => {
        test("THEN outputs cleaned file name", () => {
          _.entries(invalidFnamesAndCleaned).forEach((item) => {
            const [fname, cleaned] = item;
            const cleanedFname = NoteUtils.cleanFname({ fname });
            expect(cleanedFname).toEqual(cleaned);
            expect(NoteUtils.validateFname(cleanedFname).isValid).toBeTruthy();
          });
        });
      });
    });
  });
});
