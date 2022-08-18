import { InstallStatus, Time } from "@dendronhq/common-all";
import { MetadataService } from "@dendronhq/engine-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import { after, afterEach, beforeEach, describe } from "mocha";
import sinon, { SinonSpy, SinonStub } from "sinon";
import { ExtensionContext } from "vscode";
import { GLOBAL_STATE } from "../../constants";
import { KeybindingUtils } from "../../KeybindingUtils";
import { AnalyticsUtils } from "../../utils/analytics";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

/**
 * This is for testing functionality that is only triggered when activating
 * a workspace after installation
 */

suite("GIVEN Dendron plugin activation", function () {
  let setInitialInstallSpy: sinon.SinonSpy;
  let showTelemetryNoticeSpy: sinon.SinonSpy;
  let mockHomeDirStub: sinon.SinonStub;

  function stubDendronWhenNotFirstInstall() {
    MetadataService.instance().setInitialInstall();
  }

  function stubDendronWhenFirstInstall(ctx: ExtensionContext) {
    ctx.globalState.update(GLOBAL_STATE.VERSION, undefined);
    MetadataService.instance().setMeta(
      "welcomeClickedTime",
      Time.now().toMillis()
    );
  }

  function setupSpies() {
    setInitialInstallSpy = sinon.spy(
      MetadataService.instance(),
      "setInitialInstall"
    );
    showTelemetryNoticeSpy = sinon.spy(AnalyticsUtils, "showTelemetryNotice");
  }

  async function afterHook() {
    mockHomeDirStub.restore();
    sinon.restore();
  }

  describe("AND WHEN not first install", () => {
    describeMultiWS(
      "AND WHEN activate",
      {
        preActivateHook: async () => {
          mockHomeDirStub = TestEngineUtils.mockHomeDir();
          stubDendronWhenNotFirstInstall();
          setupSpies();
        },
        afterHook,
        timeout: 1e4,
      },
      () => {
        test("THEN set initial install not called", () => {
          expect(setInitialInstallSpy.called).toBeFalsy();
        });

        test("THEN do not show telemetry notice", () => {
          expect(showTelemetryNoticeSpy.called).toBeFalsy();
        });
      }
    );
    describeMultiWS(
      "AND WHEN firstInstall not set for old user",
      {
        preActivateHook: async () => {
          mockHomeDirStub = TestEngineUtils.mockHomeDir();
          stubDendronWhenNotFirstInstall();
          setupSpies();
          // when check for first install, should be empty
          MetadataService.instance().deleteMeta("firstInstall");
        },
        afterHook,
        timeout: 1e5,
      },
      () => {
        test("THEN set initial install called", () => {
          expect(
            setInitialInstallSpy.calledWith(
              Time.DateTime.fromISO("2021-06-22").toSeconds()
            )
          ).toBeTruthy();
        });

        test("THEN do not show telemetry notice", () => {
          expect(showTelemetryNoticeSpy.called).toBeFalsy();
        });
      }
    );
  });

  describe("AND WHEN first install", () => {
    describeMultiWS(
      "AND WHEN activate",
      {
        preActivateHook: async ({ ctx }) => {
          mockHomeDirStub = TestEngineUtils.mockHomeDir();
          setupSpies();
          stubDendronWhenFirstInstall(ctx);
        },
        noSetInstallStatus: true,
        timeout: 1e5,
      },
      () => {
        after(() => afterHook());
        test("THEN set initial install called", () => {
          expect(setInitialInstallSpy.called).toBeTruthy();
        });

        test("THEN global version set", () => {
          expect(MetadataService.instance().getGlobalVersion()).toNotEqual(
            undefined
          );
        });
        test("THEN show telemetry notice", () => {
          expect(showTelemetryNoticeSpy.called).toBeTruthy();
        });
      }
    );
  });

  describe("AND WHEN secondary install on a fresh vscode instance", () => {
    describeMultiWS(
      "AND WHEN activate",
      {
        preActivateHook: async ({ ctx }) => {
          mockHomeDirStub = TestEngineUtils.mockHomeDir();
          // new instance, so fresh user-data. global storage is clean slate.
          stubDendronWhenFirstInstall(ctx);
          // but we have first install already recorded in metadata.
          stubDendronWhenNotFirstInstall();
          setupSpies();
        },
        afterHook,
        timeout: 1e4,
        noSetInstallStatus: true,
      },
      () => {
        // we prevent this from happening in new vscode instances.
        test("THEN set initial install is not called", () => {
          expect(setInitialInstallSpy.called).toBeFalsy();
        });

        // but stil want to set this in the fresh globalStorage of the new vscode instance
        test("THEN global version set", () => {
          expect(MetadataService.instance().getGlobalVersion()).toNotEqual(
            undefined
          );
        });
      }
    );
  });
});

suite("GIVEN keybindings conflict", function () {
  let promptSpy: SinonSpy;
  let installStatusStub: SinonStub;
  describeMultiWS(
    "GIVEN initial install",
    {
      beforeHook: async () => {
        installStatusStub = sinon
          .stub(VSCodeUtils, "getInstallStatusForExtension")
          .returns(InstallStatus.INITIAL_INSTALL);
        promptSpy = sinon.spy(KeybindingUtils, "maybePromptKeybindingConflict");
      },
      noSetInstallStatus: true,
    },
    () => {
      beforeEach(() => {
        installStatusStub = sinon
          .stub(
            KeybindingUtils,
            "getInstallStatusForKnownConflictingExtensions"
          )
          .returns([{ id: "dummyExt", installed: true }]);
      });

      afterEach(() => {
        installStatusStub.restore();
      });

      after(() => {
        promptSpy.restore();
      });

      test("THEN maybePromptKeybindingConflict is called", async () => {
        expect(promptSpy.called).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "GIVEN not initial install",
    {
      beforeHook: async () => {
        promptSpy = sinon.spy(KeybindingUtils, "maybePromptKeybindingConflict");
      },
    },
    () => {
      beforeEach(() => {
        installStatusStub = sinon
          .stub(
            KeybindingUtils,
            "getInstallStatusForKnownConflictingExtensions"
          )
          .returns([{ id: "dummyExt", installed: true }]);
      });

      afterEach(() => {
        installStatusStub.restore();
      });

      after(() => {
        promptSpy.restore();
      });

      test("THEN maybePromptKeybindingConflict is not called", async () => {
        expect(promptSpy.called).toBeFalsy();
      });
    }
  );
});
