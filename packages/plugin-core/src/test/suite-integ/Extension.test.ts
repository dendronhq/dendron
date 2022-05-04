import {
  ConfigUtils,
  CONSTANTS,
  DeepPartial,
  InstallStatus,
  IntermediateDendronConfig,
  isNotUndefined,
  Time,
} from "@dendronhq/common-all";
import { tmpDir, writeYAML } from "@dendronhq/common-server";
import {
  DConfig,
  DEPRECATED_PATHS,
  LocalConfigScope,
  MetadataService,
} from "@dendronhq/engine-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import { ConfigUtils, InstallStatus, Time } from "@dendronhq/common-all";
import { DConfig, MetadataService } from "@dendronhq/engine-server";
import * as mocha from "mocha";
import { describe } from "mocha";
import sinon from "sinon";
import { ExtensionProvider } from "../../ExtensionProvider";
import { StartupUtils } from "../../utils/StartupUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

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
