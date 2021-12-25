import {
  ConfigUtils,
  DVault,
  genDefaultJournalConfig,
  IntermediateDendronConfig,
  NoteUtils,
  StrictConfigV4,
} from "@dendronhq/common-all";

describe("WHEN getConfig from note", () => {
  const fname = "foo";
  const vault: DVault = {
    name: "fooVault",
    fsPath: "fooVault",
  };
  const config = ConfigUtils.genDefaultConfig();

  describe("AND WHEN shouldShowChildLinks prop not set on note", () => {
    test("THEN shouldShowChildLinks = false", () => {
      const note = NoteUtils.create({
        vault,
        fname,
      });
      expect(ConfigUtils.shouldShowChildLinks(config, { note })).toBeTruthy();
    });
  });

  describe("AND WHEN shouldShowChildLinks prop set to false on note", () => {
    test("THEN shouldShowChildLinks = false", () => {
      const note = NoteUtils.create({
        vault,
        fname,
        config: { global: { showChildLinks: false } },
      });
      expect(ConfigUtils.shouldShowChildLinks(config, { note })).toBeFalsy();
    });
  });

  describe("AND WHEN shouldShowChildLinks prop set to true on note", () => {
    test("THEN shouldShowChildLinks = true", () => {
      const note = NoteUtils.create({
        vault,
        fname,
        config: { global: { showChildLinks: true } },
      });
      expect(ConfigUtils.shouldShowChildLinks(config, { note })).toBeTruthy();
    });
  });
});

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

      test("WHEN given v4 path AND journal value doesn't exists, THEN it returns v4 default", () => {
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

      test("WHEN given v4 path AND preview value doesn't exists, THEN it returns v4 default", () => {
        delete config["preview"];

        // testing for explicitly deleted key.
        expect(config.preview).toBeUndefined();

        const previewConfig = ConfigUtils.getPreview(
          config as IntermediateDendronConfig
        );
        expect(previewConfig).toEqual(ConfigUtils.genDefaultConfig().preview);
      });
    });
  });
});
