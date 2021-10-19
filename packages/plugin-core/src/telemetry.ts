import { DWorkspaceV2, VSCodeEvents } from "@dendronhq/common-all";
import { SegmentClient, TelemetryStatus } from "@dendronhq/common-server";
import _ from "lodash";
import * as vscode from "vscode";
import { Logger } from "./logger";
import { AnalyticsUtils } from "./utils/analytics";
import { getExtension } from "./workspace";

export function isVSCodeTelemetryEnabled(): boolean | undefined {
  // `isTelemetryEnabled` only seems to be available on VSCode 1.55 and above.
  // Our dependencies are currently set up for 1.54, so typescript does not understand that it exists.
  try {
    return (vscode.env as any).isTelemetryEnabled;
  } catch (err) {
    Logger.error({ msg: "Error when trying to access telemetry preference" });
    return undefined;
  }
}

/** Creates a SegmentClient for telemetry, if enabled, and listens for vscode telemetry settings to disable it when requested. */
export function setupSegmentClient(ws: DWorkspaceV2, cachePath?: string) {
  function instantiateSegmentClient() {
    // if the current status was set by configuration, and that configuration has changed, we should update it and report the change
    const status = SegmentClient.getStatus();
    if (SegmentClient.setByConfig(status)) {
      if (
        SegmentClient.isDisabled(status) &&
        !ws.config.noTelemetry &&
        isVSCodeTelemetryEnabled()
      ) {
        // was disabled, now enabled
        Logger.info({
          msg: "The user changed VSCode or workspace settings, so we are now disabling telemetry",
        });
        const reason = TelemetryStatus.ENABLED_BY_CONFIG;
        SegmentClient.enable(reason);
        AnalyticsUtils.track(VSCodeEvents.EnableTelemetry, { reason });
      } else if (SegmentClient.isEnabled(status)) {
        // was enabled, now disabled
        if (ws.config.noTelemetry) {
          Logger.info({
            msg: "The user change workspace settings, so we are now disabling telemetry",
          });
          const reason = TelemetryStatus.DISABLED_BY_WS_CONFIG;
          AnalyticsUtils.track(VSCodeEvents.DisableTelemetry, { reason });
          SegmentClient.disable(reason);
        } else if (!isVSCodeTelemetryEnabled()) {
          Logger.info({
            msg: "The user change VSCode settings, so we are now disabling telemetry",
          });
          const reason = TelemetryStatus.DISABLED_BY_VSCODE_CONFIG;
          AnalyticsUtils.track(VSCodeEvents.DisableTelemetry, { reason });
          SegmentClient.disable(reason);
        }
      }
    }

    const segment = SegmentClient.instance({
      forceNew: true,
      cachePath
    });
    Logger.info({ msg: `Telemetry is disabled? ${segment.hasOptedOut}` });
    Logger.info({ msg: "Segment Residual Cache Path is at " + cachePath});
  }

  try {
    // instantiate segment client right now
    instantiateSegmentClient();
    // watch the config changes to update status if it changes

    // `onDidChangeTelemetryEnabled` only seems to be available on VSCode 1.55 and above.
    // Our dependencies are currently set up for 1.54, so typescript does not understand that it exists.
    const onDidChangeTelemetryEnabled: vscode.Event<Boolean> | undefined = (
      vscode.env as any
    ).onDidChangeTelemetryEnabled;
    if (!_.isUndefined(onDidChangeTelemetryEnabled)) {
      const disposable = onDidChangeTelemetryEnabled(() =>
        instantiateSegmentClient()
      );
      getExtension().addDisposable(disposable);
    }
  } catch (err) {
    Logger.error({
      msg: "Error when trying to listen to the telemetry preference change event",
    });
  }
}
