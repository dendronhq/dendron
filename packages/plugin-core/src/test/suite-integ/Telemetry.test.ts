import { SegmentClient } from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import sinon from "sinon";
import * as vscode from "vscode";
import { DisableTelemetryCommand } from "../../commands/DisableTelemetry";
import { EnableTelemetryCommand } from "../../commands/EnableTelemetry";
import { setupSegmentClient } from "../../telemetry";
import { getWS } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { SinonStub } from "sinon";

suite("telemetry", function () {
  let ctx: vscode.ExtensionContext;
  let homeDirStub: SinonStub;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      homeDirStub = TestEngineUtils.mockHomeDir();
    },
    afterHook: async () => {
      homeDirStub.restore();
    },
  });

  function setNoTelemetry(to: boolean) {
    return async ({ wsRoot }: { wsRoot: string }) => {
      const config = DConfig.genDefaultConfig();
      config.noTelemetry = to;
      DConfig.writeConfig({ wsRoot, config });
    };
  }

  describe("configuration", () => {
    test("enabled by configuration", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async () => {
          const ws = getWS();
          sinon.stub(vscode.env as any, "isTelemetryEnabled").value(true);

          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeFalsy();

          done();
        },
      });
    });

    test("disabled by vscode configuration", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async () => {
          const ws = getWS();
          sinon.stub(vscode.env as any, "isTelemetryEnabled").value(false);

          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeTruthy();

          done();
        },
      });
    });

    test("enabled by vscode configuration, but disabled by workspace configuration", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: setNoTelemetry(true),
        onInit: async () => {
          const ws = getWS();
          sinon.stub(vscode.env as any, "isTelemetryEnabled").value(true);

          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeTruthy();

          done();
        },
      });
    });

    test("enabled by vscode configuration, but disabled by workspace configuration", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: setNoTelemetry(true),
        onInit: async () => {
          const ws = getWS();
          sinon.stub(vscode.env as any, "isTelemetryEnabled").value(true);

          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeTruthy();

          done();
        },
      });
    });

    test("disabling by command takes precedence", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async () => {
          const ws = getWS();
          sinon.stub(vscode.env as any, "isTelemetryEnabled").value(true);

          const cmd = new DisableTelemetryCommand();
          await cmd.run();

          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeTruthy();

          done();
        },
      });
    });

    test("enabling by command takes precedence", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: setNoTelemetry(true),
        onInit: async () => {
          const ws = getWS();
          sinon.stub(vscode.env as any, "isTelemetryEnabled").value(false);

          const cmd = new EnableTelemetryCommand();
          await cmd.run();

          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeFalsy();

          done();
        },
      });
    });

    test("handles configuration changing from disabled to enabled", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async () => {
          const ws = getWS();
          const stub = sinon.stub(vscode.env as any, "isTelemetryEnabled");

          stub.value(false); // telemetry is disabled
          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeTruthy();

          stub.value(true); // telemetry is enabled
          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeFalsy();

          done();
        },
      });
    });

    test("handles configuration changing from enabled to disabled", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async () => {
          const ws = getWS();
          const stub = sinon.stub(vscode.env as any, "isTelemetryEnabled");

          stub.value(true); // telemetry is enabled
          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeFalsy();

          stub.value(false); // telemetry is disabled
          setupSegmentClient(ws);
          expect(SegmentClient.instance().hasOptedOut).toBeTruthy();

          done();
        },
      });
    });
  });
});
