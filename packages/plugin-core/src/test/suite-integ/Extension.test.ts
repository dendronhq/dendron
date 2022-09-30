import {
  ConfigUtils,
  InstallStatus,
  IntermediateDendronConfig,
  Time,
} from "@dendronhq/common-all";
import {
  DEPRECATED_PATHS,
  execa,
  MetadataService,
} from "@dendronhq/engine-server";
import { VAULTS } from "@dendronhq/engine-test-utils";
import * as mocha from "mocha";
import { describe } from "mocha";
import fs from "fs-extra";
import sinon from "sinon";
import { ExtensionProvider } from "../../ExtensionProvider";
import { StartupUtils } from "../../utils/StartupUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS, describeSingleWS } from "../testUtilsV3";
import { DConfig, LocalConfigScope } from "@dendronhq/common-server";
import * as vscode from "vscode";
import os from "os";

async function inactiveMessageTest(opts: {
  done: mocha.Done;
  firstInstall?: number;
  firstWsInitialize?: number;
  inactiveUserMsgStatus?: "submitted" | "cancelled";
  inactiveUserMsgSendTime?: number;
  workspaceActivated?: boolean;
  firstLookupTime?: number;
  lastLookupTime?: number;
  shouldDisplayMessage: boolean;
}) {
  const {
    done,
    firstInstall,
    firstWsInitialize,
    inactiveUserMsgStatus,
    inactiveUserMsgSendTime,
    shouldDisplayMessage,
    firstLookupTime,
    lastLookupTime,
    workspaceActivated,
  } = opts;
  const svc = MetadataService.instance();
  svc.setMeta("firstInstall", firstInstall);
  svc.setMeta("firstWsInitialize", firstWsInitialize);
  svc.setMeta("inactiveUserMsgStatus", inactiveUserMsgStatus);
  svc.setMeta("inactiveUserMsgSendTime", inactiveUserMsgSendTime);
  svc.setMeta("dendronWorkspaceActivated", workspaceActivated);
  svc.setMeta("firstLookupTime", firstLookupTime);
  svc.setMeta("lastLookupTime", lastLookupTime);
  const expected = StartupUtils.shouldDisplayInactiveUserSurvey();
  expect(expected).toEqual(shouldDisplayMessage);
  sinon.restore();
  done();
}

function getDefaultConfig() {
  const defaultConfig: IntermediateDendronConfig = {
    ...ConfigUtils.genDefaultConfig(),
  };
  defaultConfig.workspace.vaults = VAULTS.MULTI_VAULT_WITH_THREE_VAULTS();
  return defaultConfig;
}

suite("GIVEN local config", () => {
  describe("AND WHEN workspace config is present", () => {
    const configScope: LocalConfigScope = LocalConfigScope.WORKSPACE;
    const defaultConfig = getDefaultConfig();
    const localVaults = [{ fsPath: "vault-local" }];

    describeMultiWS(
      "AND given additional vaults in local config",
      {
        preActivateHook: async ({ wsRoot }) => {
          await DConfig.writeLocalConfig({
            wsRoot,
            config: { workspace: { vaults: localVaults } },
            configScope,
          });
        },
      },
      () => {
        test("THEN engine should load with extra workspace", () => {
          const ext = ExtensionProvider.getExtension();
          const _defaultConfig = getDefaultConfig();
          _defaultConfig.workspace.vaults = localVaults.concat(
            defaultConfig.workspace.vaults
          );
          const config = ext.getDWorkspace().config;
          expect(config).toEqual(_defaultConfig);
        });
      }
    );
  });
});

// These tests run on Windows too actually, but fail on the CI. Skipping for now.

describe("shouldDisplayInactiveUserSurvey", () => {
  const ONE_WEEK = 604800;
  const NOW = Time.now().toSeconds();
  const ONE_WEEK_BEFORE = NOW - ONE_WEEK;
  const TWO_WEEKS_BEFORE = NOW - 2 * ONE_WEEK;
  const THREE_WEEKS_BEFORE = NOW - 3 * ONE_WEEK;
  const FOUR_WEEKS_BEFORE = NOW - 4 * ONE_WEEK;
  const FIVE_WEEKS_BEFORE = NOW - 5 * ONE_WEEK;
  const SIX_WEEKS_BEFORE = NOW - 6 * ONE_WEEK;
  const SEVEN_WEEKS_BEFORE = NOW - 7 * ONE_WEEK;
  describe("GIVEN not prompted yet", () => {
    describe("WHEN is first week active user AND inactive for less than four weeks", () => {
      test("THEN should not display inactive user survey", (done) => {
        inactiveMessageTest({
          done,
          firstInstall: THREE_WEEKS_BEFORE,
          firstWsInitialize: THREE_WEEKS_BEFORE,
          firstLookupTime: THREE_WEEKS_BEFORE,
          lastLookupTime: THREE_WEEKS_BEFORE,
          workspaceActivated: true,
          shouldDisplayMessage: false,
        });
      });
    });
    describe("WHEN is first week active user AND inactive for at least four weeks", () => {
      test("THEN should display inactive user survey", (done) => {
        inactiveMessageTest({
          done,
          firstInstall: FIVE_WEEKS_BEFORE,
          firstWsInitialize: FIVE_WEEKS_BEFORE,
          firstLookupTime: FIVE_WEEKS_BEFORE,
          lastLookupTime: FOUR_WEEKS_BEFORE,
          workspaceActivated: true,
          shouldDisplayMessage: true,
        });
      });
    });
  });
  describe("GIVEN already prompted", () => {
    describe("WHEN user has submitted", () => {
      test("THEN should never display inactive user survey", (done) => {
        inactiveMessageTest({
          done,
          firstInstall: FIVE_WEEKS_BEFORE,
          firstWsInitialize: FIVE_WEEKS_BEFORE,
          firstLookupTime: FIVE_WEEKS_BEFORE,
          lastLookupTime: FOUR_WEEKS_BEFORE,
          inactiveUserMsgSendTime: TWO_WEEKS_BEFORE,
          workspaceActivated: true,
          inactiveUserMsgStatus: "submitted",
          shouldDisplayMessage: false,
        });
      });
    });
    describe("WHEN it has been another four weeks since user rejected survey", () => {
      test("THEN should display inactive user survey if inactive", (done) => {
        inactiveMessageTest({
          done,
          firstInstall: SEVEN_WEEKS_BEFORE,
          firstWsInitialize: SEVEN_WEEKS_BEFORE,
          firstLookupTime: SEVEN_WEEKS_BEFORE,
          lastLookupTime: SIX_WEEKS_BEFORE,
          inactiveUserMsgSendTime: FOUR_WEEKS_BEFORE,
          workspaceActivated: true,
          inactiveUserMsgStatus: "cancelled",
          shouldDisplayMessage: true,
        });
      });
      test("THEN should not display inactive user survey if active", (done) => {
        inactiveMessageTest({
          done,
          firstInstall: SEVEN_WEEKS_BEFORE,
          firstWsInitialize: SEVEN_WEEKS_BEFORE,
          firstLookupTime: SEVEN_WEEKS_BEFORE,
          lastLookupTime: ONE_WEEK_BEFORE,
          inactiveUserMsgSendTime: FOUR_WEEKS_BEFORE,
          workspaceActivated: true,
          inactiveUserMsgStatus: "cancelled",
          shouldDisplayMessage: false,
        });
      });
    });
    describe("WHEN it hasn't been another four weeks since rejected prompt", () => {
      test("THEN should not display inactive user survey", (done) => {
        inactiveMessageTest({
          done,
          firstInstall: SEVEN_WEEKS_BEFORE,
          firstWsInitialize: SEVEN_WEEKS_BEFORE,
          firstLookupTime: SEVEN_WEEKS_BEFORE,
          lastLookupTime: SIX_WEEKS_BEFORE,
          inactiveUserMsgSendTime: THREE_WEEKS_BEFORE,
          workspaceActivated: true,
          inactiveUserMsgStatus: "cancelled",
          shouldDisplayMessage: false,
        });
      });
    });
  });
});

suite("missing default config detection", () => {
  describeMultiWS(
    "GIVEN dendron.yml with missing default key",
    {
      modConfigCb: (config) => {
        // @ts-ignore
        delete config.workspace.workspaceVaultSyncMode;
        return config;
      },
      timeout: 1e5,
    },
    () => {
      test("THEN missing defaults are detected", () => {
        const ws = ExtensionProvider.getDWorkspace();
        const config = DConfig.getRaw(ws.wsRoot);
        expect(config.workspace?.workspaceVaultSyncMode).toEqual(undefined);
        const out = ConfigUtils.detectMissingDefaults({ config });
        expect(out.needsBackfill).toBeTruthy();
        expect(
          out.backfilledConfig.workspace.workspaceVaultSyncMode
        ).toBeTruthy();
      });
    }
  );

  describe("GIVEN upgraded", () => {
    describeMultiWS(
      "AND missing default key",
      {
        modConfigCb: (config) => {
          // @ts-ignore
          delete config.workspace.workspaceVaultSyncMode;
          return config;
        },
      },
      () => {
        test("THEN prompted to add missing defaults", () => {
          const ext = ExtensionProvider.getExtension();
          const out = StartupUtils.shouldDisplayMissingDefaultConfigMessage({
            ext,
            extensionInstallStatus: InstallStatus.UPGRADED,
          });
          expect(out).toBeTruthy();
        });
      }
    );

    describeMultiWS("AND not missing default key", {}, () => {
      test("THEN not prompted to add missing defaults", () => {
        const ext = ExtensionProvider.getExtension();
        const out = StartupUtils.shouldDisplayMissingDefaultConfigMessage({
          ext,
          extensionInstallStatus: InstallStatus.UPGRADED,
        });
        expect(out).toBeFalsy();
      });
    });
  });

  describe("GIVEN not upgraded", () => {
    describeMultiWS(
      "AND missing default key",
      {
        modConfigCb: (config) => {
          // @ts-ignore
          delete config.workspace.workspaceVaultSyncMode;
          return config;
        },
      },
      () => {
        test("THEN not prompted to add missing defaults", () => {
          const ext = ExtensionProvider.getExtension();
          [InstallStatus.NO_CHANGE, InstallStatus.INITIAL_INSTALL].forEach(
            (extensionInstallStatus) => {
              const out = StartupUtils.shouldDisplayMissingDefaultConfigMessage(
                {
                  ext,
                  extensionInstallStatus,
                }
              );
              expect(out).toBeFalsy();
            }
          );
        });
      }
    );

    describeMultiWS("AND not missing default key", {}, () => {
      test("THEN not prompted to add missing defaults", () => {
        const ext = ExtensionProvider.getExtension();
        [InstallStatus.NO_CHANGE, InstallStatus.INITIAL_INSTALL].forEach(
          (extensionInstallStatus) => {
            const out = StartupUtils.shouldDisplayMissingDefaultConfigMessage({
              ext,
              extensionInstallStatus,
            });
            expect(out).toBeFalsy();
          }
        );
      });
    });
  });
});

suite("deprecated config detection", () => {
  describeMultiWS(
    "GIVEN dendron.yml with deprecated key",
    {
      modConfigCb: (config) => {
        // @ts-ignore
        config.dev = { enableWebUI: true };
        return config;
      },
      timeout: 1e5,
    },
    () => {
      test("THEN deprecated key is detected", () => {
        const ws = ExtensionProvider.getDWorkspace();
        const config = DConfig.getRaw(ws.wsRoot);
        expect((config.dev as any).enableWebUI).toBeTruthy();
        const out = ConfigUtils.detectDeprecatedConfigs({
          config,
          deprecatedPaths: DEPRECATED_PATHS,
        });
        expect(out).toEqual(["dev.enableWebUI"]);
      });
    }
  );

  describe("GIVEN upgraded", () => {
    describeMultiWS(
      "AND deprecated key exists",
      {
        modConfigCb: (config) => {
          // @ts-ignore
          config.dev = { enableWebUI: true };
          return config;
        },
        timeout: 1e5,
      },
      () => {
        test("THEN prompted to remove deprecated config", () => {
          const ext = ExtensionProvider.getExtension();
          const out = StartupUtils.shouldDisplayDeprecatedConfigMessage({
            ext,
            extensionInstallStatus: InstallStatus.UPGRADED,
          });
          expect(out).toBeTruthy();
        });
      }
    );

    describeMultiWS("AND deprecated key doesn't exist", {}, () => {
      test("THEN not prompted to remove deprecated config", () => {
        const ext = ExtensionProvider.getExtension();
        const out = StartupUtils.shouldDisplayDeprecatedConfigMessage({
          ext,
          extensionInstallStatus: InstallStatus.UPGRADED,
        });
        expect(out).toBeFalsy();
      });
    });
  });

  describe("GIVEN not upgraded", () => {
    describeMultiWS(
      "AND deprecated key exists",
      {
        modConfigCb: (config) => {
          // @ts-ignore
          config.dev = { enableWebUI: true };
          return config;
        },
        timeout: 1e5,
      },
      () => {
        test("THEN not prompted to remove deprecated config", () => {
          const ext = ExtensionProvider.getExtension();
          [InstallStatus.NO_CHANGE, InstallStatus.INITIAL_INSTALL].forEach(
            (extensionInstallStatus) => {
              const out = StartupUtils.shouldDisplayDeprecatedConfigMessage({
                ext,
                extensionInstallStatus,
              });
              expect(out).toBeFalsy();
            }
          );
        });
      }
    );

    describeMultiWS("AND deprecated key doesn't exist", {}, () => {
      test("THEN not prompted to remove deprecated config", () => {
        const ext = ExtensionProvider.getExtension();
        [InstallStatus.NO_CHANGE, InstallStatus.INITIAL_INSTALL].forEach(
          (extensionInstallStatus) => {
            const out = StartupUtils.shouldDisplayDeprecatedConfigMessage({
              ext,
              extensionInstallStatus,
            });
            expect(out).toBeFalsy();
          }
        );
      });
    });
  });
});

suite("duplicate config entry detection", () => {
  describeMultiWS(
    "GIVEN dendron.yml with duplicate config",
    {
      preActivateHook: async ({ wsRoot }) => {
        const configPath = DConfig.configPath(wsRoot);
        let configContent = fs.readFileSync(configPath, {
          encoding: "utf-8",
        });
        configContent = configContent.replace(
          "    enablePreviewV2: true",
          "    enablePreviewV2: true\n    enablePreviewV2: false"
        );
        fs.writeFileSync(configPath, configContent);
      },
    },
    () => {
      test("THEN duplicate entry is detected", () => {
        const ext = ExtensionProvider.getExtension();

        const out = StartupUtils.getDuplicateKeysMessage({
          ext,
        });

        expect(out.includes("duplicated mapping key")).toBeTruthy();
      });
    }
  );

  describeMultiWS("GIVEN dendron.yml without duplicate config", {}, () => {
    test("THEN duplicate entry is not detected", () => {
      const ext = ExtensionProvider.getExtension();

      const out = StartupUtils.getDuplicateKeysMessage({
        ext,
      });

      expect(out).toEqual(undefined);
    });
  });
});

suite("localhost blocked on user's machine", () => {
  describeSingleWS(
    "GIVEN localhost is blocked on user's machine",
    { timeout: 5e3 },
    () => {
      test("THEN warning toaster with mitigation docs link is displayed", async () => {
        sinon.stub(execa, "command").resolves({
          failed: true,
          stderr: Buffer.from("error"),
          stdout: Buffer.from(""),
          isCanceled: false,
          command: "ping",
          exitCode: 0,
          timedOut: false,
          killed: false,
        });
        const warningToaster = sinon
          .stub(vscode.window, "showWarningMessage")
          .resolves(undefined);
        await StartupUtils.showWhitelistingLocalhostDocsIfNecessary();
        expect(warningToaster.callCount).toEqual(1);
        expect(warningToaster.args[0][0]).toEqual(
          "Dendron is facing issues while connecting with localhost. Please ensure that you don't have anything running that can block localhost."
        );
        expect(warningToaster.args[0][1]).toEqual("Open troubleshooting docs");
      });
    }
  );
  describeMultiWS(
    "GIVEN localhost is not blocked user's machine",
    { timeout: 5e3 },
    () => {
      test("THEN dendron inits", async () => {
        const pingArgs =
          os.platform() === "win32"
            ? "ping -n 1 127.0.0.1"
            : "ping -c 1 127.0.0.1";
        sinon
          .stub(execa, "command")
          .withArgs(pingArgs)
          .resolves({
            failed: false,
            stderr: Buffer.from(""),
            stdout: Buffer.from(""),
            isCanceled: false,
            command: "ping",
            exitCode: 0,
            timedOut: false,
            killed: false,
          });
        const warningToaster = sinon
          .stub(vscode.window, "showWarningMessage")
          .resolves(undefined);
        await StartupUtils.showWhitelistingLocalhostDocsIfNecessary();
        expect(warningToaster.callCount).toEqual(0);
      });
    }
  );
});
