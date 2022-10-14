import { ConfigUtils, DVault, NoteUtils } from "@dendronhq/common-all";

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
    describe("GIVEN config v4 and client version 0.83", () => {
      test("THEN config is invalid but allowed because v5 is a soft mapping", (done) => {
        // this tests for users who decided not to migrate on v83.
        // because v4 outdated but still compatible, we will still display a notice but not exit the process in cli.
        const resp = ConfigUtils.configIsValid({
          clientVersion: "0.83.0",
          configVersion: 4,
        });
        expect(resp.isValid).toBeFalsy();
        expect(resp.reason).toEqual("config");
        expect(resp.minCompatClientVersion).toEqual("0.70.0");
        expect(resp.minCompatConfigVersion).toEqual("5");
        expect(resp.isSoftMapping).toBeTruthy();
        done();
      });
    });
    describe("GIVEN config v5 and client version 0.83", () => {
      test("THEN config is valid", (done) => {
        const resp = ConfigUtils.configIsValid({
          clientVersion: "0.83.0",
          configVersion: 5,
        });
        expect(resp.isValid).toBeTruthy();
        done();
      });
    });
    describe("GIVEN config v5 and client version 0.82", () => {
      test("THEN config is invalid because client is incompatible", (done) => {
        // this tests for validation where user updated to v5, but hasn't update dendron-cli
        const resp = ConfigUtils.configIsValid({
          clientVersion: "0.82.0",
          configVersion: 5,
        });
        expect(resp.isValid).toBeFalsy();
        expect(resp.reason).toEqual("client");
        expect(resp.minCompatClientVersion).toEqual("0.83.0");
        expect(resp.minCompatConfigVersion).toEqual("4");
        done();
      });
    });
  });
});
