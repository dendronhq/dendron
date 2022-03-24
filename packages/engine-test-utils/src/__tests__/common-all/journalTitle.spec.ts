import { getJournalTitle } from "@dendronhq/common-all";

/**
 * Tests the behavior around generating the note title for a journal note
 */
describe("GIVEN journal note title generation", () => {
  describe("WHEN a journal note with the default format like journal.2021.01.01", () => {
    test("THEN note title should be formatted properly", () => {
      const result = getJournalTitle("journal.2021.01.01", "y.MM.dd");
      expect(result).toEqual("2021-01-01");
    });
  });

  describe("WHEN a journal note with a note name like double.prefix.2021.01.01", () => {
    test("THEN note title should be formatted properly", () => {
      const result = getJournalTitle("double.prefix.2021.01.01", "y.MM.dd");
      expect(result).toEqual("2021-01-01");
    });
  });

  describe("WHEN a journal note with a note name like journal.12.01 without the year", () => {
    test("THEN note title should be formatted properly", () => {
      const result = getJournalTitle("journal.12.01", "MM.dd");
      expect(result).toEqual("12-01");
    });
  });

  describe("WHEN a journal note with a configured date format of MM-dd like journal.12-01 with dashes", () => {
    test("THEN note title should be formatted properly", () => {
      const result = getJournalTitle("journal.12-01", "MM-dd");
      expect(result).toEqual("12-01");
    });
  });

  describe("WHEN a journal note does not match the configured date format ", () => {
    test("THEN note title override should return undefined", () => {
      const result = getJournalTitle("journal.12.01", "MM-dd");
      expect(result).toBeFalsy();
    });
  });

  describe("WHEN a journal note has a suffix like journal.2021.01.01.suffix", () => {
    test("THEN note title override should return undefined", () => {
      const result = getJournalTitle("journal.2021.01.01.suffix", "y.MM.dd");
      expect(result).toBeFalsy();
    });
  });
});
