import { describe, it } from "mocha";
import {
  extractHeaderAnchorIfExists,
  extractNoteIdFromHref,
} from "../../commands/ShowPreview";
import { expect } from "../testUtilsv2";

suite("ShowPreview utility methods", () => {
  describe(`extractHeaderAnchorIfExists`, () => {
    it("WHEN anchor exists THEN return it", () => {
      const anchor = extractHeaderAnchorIfExists(
        "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/foo#heading-2"
      );
      expect(anchor?.value).toEqual("heading-2");
      expect(anchor?.type).toEqual("header");
    });

    it(`WHEN anchor does NOT exist THEN return undefined`, () => {
      expect(
        extractHeaderAnchorIfExists(
          "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/foo"
        )
      ).toEqual(undefined);
    });
  });

  describe(`extractNoteIdFromHref`, () => {

    describe(`WHEN id is present`, () => {
      it("AND with header anchor THEN extract id", () => {
        const actual = extractNoteIdFromHref({
          id: "id1",
          href: "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/FSi3bKWQeQXYTjE1PoTB0#heading-2",
        });

        expect(actual).toEqual("FSi3bKWQeQXYTjE1PoTB0");
      });

      it("AND without the header anchor THEN extract id", () => {
        const actual = extractNoteIdFromHref({
          id: "id1",
          href: "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/FSi3bKWQeQXYTjE1PoTB0",
        });

        expect(actual).toEqual("FSi3bKWQeQXYTjE1PoTB0");
      });

      it("AND is guid like", () => {
        // This shouldnt typically happen with the way we currently generate ids but we do
        // have some guid like ids in our test workspace right now so to make those
        // notes happy, and in case some older id generation used guid looking identifers.

        const actual = extractNoteIdFromHref({
          id: "id1",
          href: "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/56497553-c195-4ec8-bc74-6a76462d9333",
        });

        expect(actual).toEqual("56497553-c195-4ec8-bc74-6a76462d9333");
      });
    });

    it(`WHEN id not present in href THEN default onto passed in id`, () => {
      const actual = extractNoteIdFromHref({
        id: "id1",
        href: "http://localhost:3005/vscode/note-preview.html?ws=WS-VALUE&port=3005#head2",
      });
      expect(actual).toEqual("id1");
    });
  });
});
