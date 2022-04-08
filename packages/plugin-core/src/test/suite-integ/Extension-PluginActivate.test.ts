import { Time } from "@dendronhq/common-all";
import { MetadataService } from "@dendronhq/engine-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import sinon from "sinon";
import { ExtensionContext } from "vscode";
import { GLOBAL_STATE } from "../../constants";
import { AnalyticsUtils } from "../../utils/analytics";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

suite("GIVEN Dendron plugin activation", function () {
  let setInitialInstallSpy: sinon.SinonSpy;
  let showTelemetryNoticeSpy: sinon.SinonSpy;
  let mockHomeDirStub: sinon.SinonStub;

  function stubDendronWhenNotFirstInstall() {
    MetadataService.instance().setInitialInstall();
  }

  function stubDendronWhenFirstInstall(ctx: ExtensionContext) {
    ctx.globalState.update(GLOBAL_STATE.VERSION, undefined);
    MetadataService.instance().setMeta("welcomeClicked", Time.now().toMillis());
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
      (ctx: ExtensionContext) => {
        test("THEN set initial install called", () => {
          expect(setInitialInstallSpy.called).toBeTruthy();
        });

        test("THEN global version set", () => {
          expect(ctx.globalState.get(GLOBAL_STATE.VERSION)).toNotEqual(
            undefined
          );
        });
        test("THEN show telemetry notice", () => {
          expect(showTelemetryNoticeSpy.called).toBeTruthy();
        });
        test("THEN welcomeClick timestamp removed", () => {
          const welcomeClicked = MetadataService.instance().getWelcomeClicked();
          expect(welcomeClicked).toBeFalsy();
        });

        this.afterAll(afterHook);
      }
    );
  });
});
