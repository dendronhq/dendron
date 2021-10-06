import { describe, it, suite, beforeEach } from "mocha";
import { expect } from "../testUtilsv2";
import {
  TransformedQueryString,
  transformQueryString,
} from "../../components/lookup/LookupProviderV3";

suite("LookupProviderV3 utility methods:", () => {
  describe(`transformQueryString tests:`, () => {
    describe(`WHEN given simple string with slashes`, () => {
      let transformed: TransformedQueryString;

      beforeEach(() => {
        transformed = transformQueryString({
          pickerValue: "some/string/value",
        });
      });

      it(`THEN convert to query string to dots`, () => {
        expect(transformed.queryString).toEqual("some.string.value");
      });

      it(`THEN wasMadeFromWikiLink is false`, () => {
        expect(transformed.wasMadeFromWikiLink).toEqual(false);
      });
    });

    describe(`WHEN given simple string with dots`, () => {
      let transformed: TransformedQueryString;

      beforeEach(() => {
        transformed = transformQueryString({
          pickerValue: "some.string.value",
        });
      });

      it(`THEN value stays as is`, () => {
        expect(transformed.queryString).toEqual("some.string.value");
      });

      it(`THEN wasMadeFromWikiLink is false`, () => {
        expect(transformed.wasMadeFromWikiLink).toEqual(false);
      });
    });

    describe(`WHEN given string with OR operator`, () => {
      let transformed: TransformedQueryString;

      beforeEach(() => {
        transformed = transformQueryString({ pickerValue: "v1 | v2" });
      });

      it(`THEN value stays as is`, () => {
        expect(transformed.queryString).toEqual("v1 | v2");
      });

      it(`THEN wasMadeFromWikiLink is false`, () => {
        expect(transformed.wasMadeFromWikiLink).toEqual(false);
      });
    });

    describe(`WHEN given string with wiki link without description`, () => {
      let transformed: TransformedQueryString;

      beforeEach(() => {
        transformed = transformQueryString({
          pickerValue: "[[some.string.value]]",
        });
      });

      it(`THEN strip out wiki link decoration`, () => {
        expect(transformed.queryString).toEqual("some.string.value");
      });

      it(`THEN wasMadeFromWikiLink is true`, () => {
        expect(transformed.wasMadeFromWikiLink).toEqual(true);
      });
    });

    describe(`WHEN given string with wiki link with description`, () => {
      let transformed: TransformedQueryString;

      beforeEach(() => {
        transformed = transformQueryString({
          pickerValue: "[[some description|some.string.value]]",
        });
      });

      it(`THEN strip out wiki link decoration and description`, () => {
        expect(transformed.queryString).toEqual("some.string.value");
      });

      it(`THEN wasMadeFromWikiLink is true`, () => {
        expect(transformed.wasMadeFromWikiLink).toEqual(true);
      });
    });

    describe(`WHEN given string fully qualified with wiki link with description`, () => {
      let transformed: TransformedQueryString;

      beforeEach(() => {
        transformed = transformQueryString({
          pickerValue:
            "[[some description|dendron://private/some.string.value]]",
        });
      });

      it(`THEN strip out wiki link decoration and description`, () => {
        expect(transformed.queryString).toEqual("some.string.value");
      });

      it(`THEN wasMadeFromWikiLink is true`, () => {
        expect(transformed.wasMadeFromWikiLink).toEqual(true);
      });
    });

    describe(`WHEN given string fully qualified with wiki link with description and header`, () => {
      let transformed: TransformedQueryString;

      beforeEach(() => {
        transformed = transformQueryString({
          pickerValue:
            "[[some description|dendron://private.vault/some.string.value#header-val]]",
        });
      });

      // For now since we don't index the headers they need to be stripped out to be able
      // to query for the note.
      it(`THEN strip out wiki link decoration and description and header`, () => {
        expect(transformed.queryString).toEqual("some.string.value");
      });

      it(`THEN wasMadeFromWikiLink is true`, () => {
        expect(transformed.wasMadeFromWikiLink).toEqual(true);
      });

      it(`THEN vaultName is extracted`, () => {
        expect(transformed.vaultName).toEqual("private.vault");
      });
    });
  });
});
