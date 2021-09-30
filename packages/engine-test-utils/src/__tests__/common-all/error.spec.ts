import { ErrorMessages } from "@dendronhq/common-all";

describe(`ErrorMessages tests:`, () => {
  describe(`formatShouldNeverOccurMsg tests:`, () => {
    it(`WHEN description is supplied THEN format with description`, () => {
      expect(
        ErrorMessages.formatShouldNeverOccurMsg("Description val.")
      ).toEqual(
        "Description val. This error should never occur! Please report a bug if you have encountered this."
      );
    });

    it(`WHEN description is omitted THEN format default`, () => {
      expect(ErrorMessages.formatShouldNeverOccurMsg()).toEqual(
        "This error should never occur! Please report a bug if you have encountered this."
      );
    });
  });
});
