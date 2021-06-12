import _ from "lodash";
import * as vscode from "vscode";
import { getWS } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { describe } from "mocha";
import sinon from "sinon";
import { SegmentClient } from "@dendronhq/common-server";
import { setupSegmentClient } from "../../telemetry";
import { FileTestUtils } from "@dendronhq/common-test-utils";
import { TestConfigUtils } from "@dendronhq/engine-test-utils";
import { DisableTelemetryCommand } from "../../commands/DisableTelemetry";
import { EnableTelemetryCommand } from "../../commands/EnableTelemetry";

suite("telemetry", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      FileTestUtils.mockHome();
    },
  });

  function setNoTelemetry(to: boolean) {
    return async ({ wsRoot }: { wsRoot: string }) => {
      TestConfigUtils.withConfig(
        (config) => {
          config.noTelemetry = to;
          return config;
        },
        { wsRoot }
      );
    };
  }

  describe("configuration", () => {
    test("enabled by configuration", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({}) => {
          const ws = getWS();
          sinon.stub(vscode.env as any, "isTelemetryEnabled").value(true);

          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeFalsy();

          sinon.restore();
          done();
        },
      });
    });

    test("disabled by vscode configuration", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({}) => {
          const ws = getWS();
          sinon.stub(vscode.env as any, "isTelemetryEnabled").value(false);

          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeTruthy();

          sinon.restore();
          done();
        },
      });
    });

    test("enabled by vscode configuration, but disabled by workspace configuration", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: setNoTelemetry(true),
        onInit: async ({}) => {
          const ws = getWS();
          sinon.stub(vscode.env as any, "isTelemetryEnabled").value(true);

          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeTruthy();

          sinon.restore();
          done();
        },
      });
    });

    test("enabled by vscode configuration, but disabled by workspace configuration", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: setNoTelemetry(true),
        onInit: async ({}) => {
          const ws = getWS();
          sinon.stub(vscode.env as any, "isTelemetryEnabled").value(true);

          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeTruthy();

          sinon.restore();
          done();
        },
      });
    });

    test("disabling by command takes precedence", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({}) => {
          const ws = getWS();
          sinon.stub(vscode.env as any, "isTelemetryEnabled").value(true);

          const cmd = new DisableTelemetryCommand();
          await cmd.run();

          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeTruthy();

          sinon.restore();
          done();
        },
      });
    });

    test("enabling by command takes precedence", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: setNoTelemetry(true),
        onInit: async ({}) => {
          const ws = getWS();
          sinon.stub(vscode.env as any, "isTelemetryEnabled").value(false);

          const cmd = new EnableTelemetryCommand();
          await cmd.run();

          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeFalsy();

          sinon.restore();
          done();
        },
      });
    });

    test("handles configuration changing from disabled to enabled", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({}) => {
          const ws = getWS();
          const stub = sinon.stub(vscode.env as any, "isTelemetryEnabled");

          stub.value(false); // telemetry is disabled
          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeTruthy();

          stub.value(true); // telemetry is enabled
          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeFalsy();

          sinon.restore();
          done();
        },
      });
    });

    test("handles configuration changing from enabled to disabled", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({}) => {
          const ws = getWS();
          const stub = sinon.stub(vscode.env as any, "isTelemetryEnabled");

          stub.value(true); // telemetry is enabled
          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeFalsy();

          stub.value(false); // telemetry is disabled
          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeTruthy();

          sinon.restore();
          done();
        },
      });
    });
  });
});
