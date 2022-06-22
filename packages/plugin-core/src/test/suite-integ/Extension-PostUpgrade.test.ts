import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import { beforeEach, describe, it } from "mocha";
import semver from "semver";
import sinon from "sinon";
import * as vscode from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { ConfigMigrationUtils } from "../../utils/ConfigMigration";
import { DendronExtension } from "../../workspace";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

/**
 * This is for testing functionality that is only triggered when upgrading
 * a workspace
 */

suite("WHEN migrate config", function () {
  let promptSpy: sinon.SinonSpy;
  let confirmationSpy: sinon.SinonSpy;
  let mockHomeDirStub: sinon.SinonStub;

  async function beforeSetup({ version }: { version: string }) {
    mockHomeDirStub = TestEngineUtils.mockHomeDir();
    DendronExtension.version = () => version;
  }

  async function afterHook() {
    mockHomeDirStub.restore();
    sinon.restore();
  }

  function setupSpies() {
    promptSpy = sinon.spy(ConfigMigrationUtils, "maybePromptConfigMigration");
    confirmationSpy = sinon.spy(
      ConfigMigrationUtils,
      "showConfigMigrationConfirmationMessage"
    );
  }

  describeMultiWS(
    "GIVEN: current version is 0.83.0 and config is legacy",
    {
      modConfigCb: (config) => {
        config.version = 4;
        return config;
      },
      preSetupHook: async () => {
        setupSpies();
        await beforeSetup({ version: "0.83.0" });
      },
      afterHook,
      skipMigrations: false,
    },
    () => {
      test("THEN: config migration is prompted on init", () => {
        const ws = ExtensionProvider.getDWorkspace();
        const config = ws.config;
        expect(config.version).toEqual(4);

        expect(promptSpy.returnValues[0]).toEqual(true);
        expect(confirmationSpy.called).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "GIVEN: current version is 0.83.0 and config is up to date",
    {
      modConfigCb: (config) => {
        config.version = 5;
        return config;
      },
      preSetupHook: async () => {
        setupSpies();
        await beforeSetup({ version: "0.83.0" });
      },
      afterHook,
      skipMigrations: false,
    },
    () => {
      test("THEN: config migration is not prompted on init", () => {
        const ws = ExtensionProvider.getDWorkspace();
        const config = ws.config;
        expect(config.version).toEqual(5);

        expect(promptSpy.returnValues[0]).toEqual(false);
        expect(confirmationSpy.called).toBeFalsy();
      });
    }
  );

  describeMultiWS(
    "GIVEN: current version is 0.84.0 and config is legacy",
    {
      modConfigCb: (config) => {
        config.version = 4;
        return config;
      },
      preSetupHook: async () => {
        setupSpies();
        await beforeSetup({ version: "0.84.0" });
      },
      afterHook,
      skipMigrations: false,
    },
    () => {
      test("THEN: config migration is prompted on init", () => {
        const ws = ExtensionProvider.getDWorkspace();
        const config = ws.config;
        expect(config.version).toEqual(4);

        expect(promptSpy.returnValues[0]).toEqual(true);
        expect(confirmationSpy.called).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "GIVEN: current version is 0.84.0 and config is up to date",
    {
      modConfigCb: (config) => {
        config.version = 5;
        return config;
      },
      preSetupHook: async () => {
        setupSpies();
        await beforeSetup({ version: "0.84.0" });
      },
      afterHook,
      skipMigrations: false,
    },
    () => {
      test("THEN: config migration is not prompted on init", () => {
        const ws = ExtensionProvider.getDWorkspace();
        const config = ws.config;
        expect(config.version).toEqual(5);

        expect(promptSpy.returnValues[0]).toEqual(false);
        expect(confirmationSpy.called).toBeFalsy();
      });
    }
  );
});

suite(
  "temporary testing of Dendron version compatibility downgrade sequence",
  () => {
    describe(`GIVEN the activation sequence of Dendron`, () => {
      describe(`WHEN VS Code Version is up to date`, () => {
        let invokedWorkspaceTrustFn: boolean = false;

        beforeEach(() => {
          invokedWorkspaceTrustFn = semver.gte(vscode.version, "1.57.0");
        });

        it(`THEN onDidGrantWorkspaceTrust will get invoked.`, () => {
          expect(invokedWorkspaceTrustFn).toEqual(true);
        });

        it(`AND onDidGrantWorkspaceTrust can be found in the API.`, () => {
          vscode.workspace.onDidGrantWorkspaceTrust(() => {
            //no-op for testing
          });
        });
      });

      describe(`WHEN VS Code Version is on a version less than 1.57.0`, () => {
        let invokedWorkspaceTrustFn: boolean = false;
        const userVersion = "1.56.1";
        beforeEach(() => {
          invokedWorkspaceTrustFn = semver.gte(userVersion, "1.57.0");
        });

        it(`THEN onDidGrantWorkspaceTrust will not get invoked.`, () => {
          expect(invokedWorkspaceTrustFn).toEqual(false);
        });
      });
    });
  }
);
