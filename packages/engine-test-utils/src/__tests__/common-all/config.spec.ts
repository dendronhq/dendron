import {
  ConfigUtils,
  DVault,
  genDefaultJournalConfig,
  IntermediateDendronConfig,
  StrictConfigV3,
} from "@dendronhq/common-all";
import _ from "lodash";

describe("ConfigUtils", () => {
  describe("getProps", () => {
    describe("GIVEN v3 config", () => {
      let config: Partial<StrictConfigV3>;
      beforeEach(() => {
        config = ConfigUtils.genDefaultConfig() as Partial<StrictConfigV3>;
      });

      test("WHEN given a v3 path AND value exists, THEN it returns the correct value", () => {
        const expected = [{ fsPath: "foo" }, { fsPath: "bar" }] as DVault[];
        config.workspace!.vaults = expected;

        const vaults = ConfigUtils.getProp(
          config as IntermediateDendronConfig,
          "workspace.vaults"
        );

        expect(vaults).toEqual(expected);
      });

      test("WHEN given v3 path AND value doesn't exists, THEN it returns v3 default", () => {
        const expected = genDefaultJournalConfig();
        // @ts-ignore
        delete config.workspace.journal;

        expect(config.workspace!.journal).toBeUndefined();

        const journalConfig = ConfigUtils.getProp(
          config as IntermediateDendronConfig,
          "workspace.journal"
        );

        expect(journalConfig).toEqual(expected);
      });
    });
  });
});
