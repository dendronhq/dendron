import { describe, it } from "mocha";
import { expect } from "../testUtilsv2";
import { ScrollSyncUtil } from "../../commands/SyncPreviewCommand";

suite("SyncPreviewCommand tests", () => {
  describe(`ScrollSyncUtil tests:`, () => {
    describe(`replaceTextForMatch`, () => {
      it(`WHEN no special chars THEN keep as is`, () => {
        expect(ScrollSyncUtil.replaceTextForMatch("hi world")).toEqual(
          "hi world"
        );
      });

      it("WHEN starts with star space THEN remove the star", () => {
        expect(ScrollSyncUtil.replaceTextForMatch("* hi world")).toEqual(
          "hi world"
        );
      });

      it("WHEN starts with space star space THEN remove the star", () => {
        expect(ScrollSyncUtil.replaceTextForMatch("  * hi world")).toEqual(
          "hi world"
        );
      });

      it("WHEN starts with star without space THEN keep the star", () => {
        expect(ScrollSyncUtil.replaceTextForMatch("*hi world")).toEqual(
          "*hi world"
        );
      });

      it("WHEN starts # and space THEN remove the #", () => {
        expect(ScrollSyncUtil.replaceTextForMatch("# hi")).toEqual("hi");
      });

      it("WHEN starts with two # and space THEN remove the #", () => {
        expect(ScrollSyncUtil.replaceTextForMatch("## hi")).toEqual("hi");
      });
    });
  });
});
