import {
  ConfigUtils,
  DVault,
  genDefaultJournalConfig,
  IntermediateDendronConfig,
  StrictConfigV4,
} from "@dendronhq/common-all";
import _ from "lodash";

describe("ConfigUtils", () => {
  describe("getProps", () => {
    describe("GIVEN v4 config", () => {
      let config: Partial<StrictConfigV4>;
      beforeEach(() => {
        config = ConfigUtils.genDefaultConfig() as Partial<StrictConfigV4>;
      });

      test("WHEN given a v4 path AND value exists, THEN it returns the correct value", () => {
        const expected = [{ fsPath: "foo" }, { fsPath: "bar" }] as DVault[];
        ConfigUtils.setVaults(config as IntermediateDendronConfig, expected);

        const vaults = ConfigUtils.getProp(
          config as IntermediateDendronConfig,
          "workspace"
        ).vaults;

        expect(vaults).toEqual(expected);
      });

      test("WHEN given v4 path AND value doesn't exists, THEN it returns v4 default", () => {
        const expected = genDefaultJournalConfig();
        // @ts-ignore
        delete config.workspace["journal"];

        // testing for explicitly deleted key.
        expect(config.workspace!.journal).toBeUndefined();

        const journalConfig = ConfigUtils.getProp(
          config as IntermediateDendronConfig,
          "workspace"
        ).journal;

        expect(journalConfig).toEqual(expected);
      });
    });
  });
});
