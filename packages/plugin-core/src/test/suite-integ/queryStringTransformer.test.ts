import { describe, it, suite, beforeEach } from "mocha";
import { expect } from "../testUtilsv2";
import { TransformedQueryString } from "../../components/lookup/types";
import { transformQueryString } from "../../components/lookup/queryStringTransformer";

suite("transformQueryString tests:", () => {
  describe(`WHEN given simple string with slashes`, () => {
    let transformed: TransformedQueryString;

    beforeEach(() => {
      transformed = transformQueryString({
        pickerValue: "some/string/value",
      });
    });

    it(`THEN convert to query string to spaces`, () => {
      expect(transformed.queryString).toEqual("some string value");
    });

    it(`THEN split by dots is populates with values`, () => {
      expect(transformed.splitByDots).toEqual(["some", "string", "value"]);
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

    it(`THEN dots are transformed to spaces`, () => {
      expect(transformed.queryString).toEqual("some string value");
    });

    it(`THEN split by dots is populates with values`, () => {
      expect(transformed.splitByDots).toEqual(["some", "string", "value"]);
    });

    it(`THEN wasMadeFromWikiLink is false`, () => {
      expect(transformed.wasMadeFromWikiLink).toEqual(false);
    });
  });

  describe(`WHEN onlyDirectChildren is set`, () => {
    [
      ["dev.vs.", "^dev.vs."],
      ["^dev.vs.", "^dev.vs."],
    ].forEach((arr) => {
      it(`WHEN input='${arr[0]}' THEN output is '${arr[1]}'`, () => {
        const transformed = transformQueryString({
          pickerValue: arr[0],
          onlyDirectChildren: true,
        });

        expect(transformed.queryString).toEqual(arr[1]);
      });
    });
  });

  describe(`WHEN given string with dot that ends with a dot`, () => {
    let transformed: TransformedQueryString;

    beforeEach(() => {
      transformed = transformQueryString({
        pickerValue: "some.string.value.",
      });
    });

    it(`THEN do NOT split by dots`, () => {
      expect(transformed.queryString).toEqual("some.string.value.");
    });

    it(`THEN split by dots is not populated`, () => {
      expect(transformed.splitByDots).toBeFalsy();
    });

    it(`THEN wasMadeFromWikiLink is false`, () => {
      expect(transformed.wasMadeFromWikiLink).toEqual(false);
    });
  });

  describe(`WHEN given string with dots and separate search tokens`, () => {
    let transformed: TransformedQueryString;

    beforeEach(() => {
      transformed = transformQueryString({
        pickerValue: "some.string.value t1 t2 c1.c2",
      });
    });

    it(`THEN dots of initial string are transformed to spaces`, () => {
      expect(transformed.queryString).toEqual("some string value t1 t2 c1.c2");
    });

    it(`THEN split by dots is populates with values from dotted string`, () => {
      expect(transformed.splitByDots).toEqual(["some", "string", "value"]);
    });

    it(`THEN wasMadeFromWikiLink is false`, () => {
      expect(transformed.wasMadeFromWikiLink).toEqual(false);
    });
  });

  describe(`WHEN given simple string with space inside and on the side`, () => {
    let transformed: TransformedQueryString;

    beforeEach(() => {
      transformed = transformQueryString({
        pickerValue: " some string.value  ",
      });
    });

    it(`THEN trim the side spaces keep the inside space`, () => {
      expect(transformed.queryString).toEqual("some string.value");
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

  describe(`WHEN given string with wiki link with side spaces`, () => {
    let transformed: TransformedQueryString;

    beforeEach(() => {
      transformed = transformQueryString({
        pickerValue: "  [[some.string.value]]   ",
      });
    });

    it(`THEN strip out spaces and wiki link decoration`, () => {
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
        pickerValue: "[[some description|dendron://private/some.string.value]]",
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
