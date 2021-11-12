import { describe, it } from "mocha";
import { Logger } from "../../logger";
import { expect } from "../testUtilsv2";

suite("logger tests", () => {
  describe(`tryExtractFullPath tests`, () => {
    it(`WHEN payload has full path THEN extract it`, () => {
      const inputPayload = {
        error: {
          payload: '"{\\"fullPath\\":\\"/tmp/full-path-val\\"}"',
        },
      };
      // @ts-ignore
      const actual = Logger.tryExtractFullPath(inputPayload);
      expect(actual).toEqual("/tmp/full-path-val");
    });

    it("WHEN payload does not have full path THEN do NOT throw", () => {
      const inputPayload = {
        error: {
          payload: '"{\\"noFullPath\\":\\"/tmp/full-path-val\\"}"',
        },
      };
      // @ts-ignore
      const actual = Logger.tryExtractFullPath(inputPayload);
      expect(actual).toEqual(undefined);
    });
  });
});
