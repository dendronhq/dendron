import {
  ConfigUtils,
  DVault,
  genDefaultJournalConfig,
  IntermediateDendronConfig,
  NoteUtils,
} from "@dendronhq/common-all";

describe("WHEN getConfig from note", () => {
  const fname = "foo";
  const vault: DVault = {
    name: "fooVault",
    fsPath: "fooVault",
  };
  const config = ConfigUtils.genDefaultConfig();

  describe("AND WHEN getEnableChildLinks prop not set on note", () => {
    test("THEN getEnableChildLinks = false", () => {
      const note = NoteUtils.create({
        vault,
        fname,
      });
      expect(ConfigUtils.getEnableChildLinks(config, { note })).toBeTruthy();
    });
  });

  describe("AND WHEN getEnableChildLinks prop set to false on note", () => {
    test("THEN getEnableChildLinks = false", () => {
      const note = NoteUtils.create({
        vault,
        fname,
        config: { global: { enableChildLinks: false } },
      });
      expect(ConfigUtils.getEnableChildLinks(config, { note })).toBeFalsy();
    });
  });

  describe("AND WHEN getEnableChildLinks prop set to true on note", () => {
    test("THEN getEnableChildLinks = true", () => {
      const note = NoteUtils.create({
        vault,
        fname,
        config: { global: { enableChildLinks: true } },
      });
      expect(ConfigUtils.getEnableChildLinks(config, { note })).toBeTruthy();
    });
  });
});

describe("ConfigUtils", () => {
  describe("configIsValid", () => {
    describe("GIVEN config v2 and client version 0.62", () => {
      test("THEN config is invalid because client is incompatible", (done) => {
        const resp = ConfigUtils.configIsValid({
          clientVersion: "0.62.0",
          configVersion: 2,
        });
        expect(resp.isValid).toBeFalsy();
        expect(resp.reason).toEqual("client");
        expect(resp.minCompatClientVersion).toEqual("0.63.0");
        expect(resp.minCompatConfigVersion).toEqual("1");
        done();
      });
    });
    describe("GIVEN config v2 and client version 0.63", () => {
      test("THEN config is valid", (done) => {
        const resp = ConfigUtils.configIsValid({
          clientVersion: "0.63.0",
          configVersion: 2,
        });
        expect(resp.isValid).toBeTruthy();
        done();
      });
    });
    describe("GIVEN config v2 and client version 0.64", () => {
      test("THEN config is valid", (done) => {
        const resp = ConfigUtils.configIsValid({
          clientVersion: "0.64.0",
          configVersion: 2,
        });
        expect(resp.isValid).toBeTruthy();
        done();
      });
    });
    describe("GIVEN config v2 and client version 0.65", () => {
      test("THEN config is invalid because config is incompatible", (done) => {
        const resp = ConfigUtils.configIsValid({
          clientVersion: "0.65.0",
          configVersion: 2,
        });
        expect(resp.isValid).toBeFalsy();
        expect(resp.reason).toEqual("config");
        expect(resp.minCompatClientVersion).toEqual("0.63.0");
        expect(resp.minCompatConfigVersion).toEqual("3");
        done();
      });
    });
    describe("GIVEN config v2 and client version 0.71", () => {
      test("THEN config is invalid because config is incompatible", (done) => {
        const resp = ConfigUtils.configIsValid({
          clientVersion: "0.71.0",
          configVersion: 2,
        });
        expect(resp.isValid).toBeFalsy();
        expect(resp.reason).toEqual("config");
        expect(resp.minCompatClientVersion).toEqual("0.63.0");
        expect(resp.minCompatConfigVersion).toEqual("4");
        done();
      });
    });
  });

  describe("getProps", () => {
    describe("GIVEN v4 config", () => {
      let config: Partial<IntermediateDendronConfig>;
      beforeEach(() => {
        config = ConfigUtils.genDefaultConfig();
        const site = {
          copyAssets: true,
          siteHierarchies: ["root"],
          siteRootDir: "docs",
          usePrettyRefs: true,
          title: "Dendron",
          description: "Personal knowledge space",
          siteLastModified: true,
          gh_edit_branch: "main",
        };
        ConfigUtils.setProp(config as IntermediateDendronConfig, "version", 4);
        ConfigUtils.setProp(config as IntermediateDendronConfig, "site", site);
        ConfigUtils.unsetProp(
          config as IntermediateDendronConfig,
          "publishing"
        );
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
