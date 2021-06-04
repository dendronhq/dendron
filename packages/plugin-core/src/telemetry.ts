import { SegmentClient } from "@dendronhq/common-server";
import * as vscode from "vscode";
import { Logger } from "./logger";
import { DendronWorkspace } from "./workspace";
import _ from "lodash";

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
export function setupSegmentClient(ws: DendronWorkspace) {
  function instantiateSegmentClient() {
    SegmentClient.instance({
      optOut: ws.config.noTelemetry || !isVSCodeTelemetryEnabled(),
      forceNew: true,
    });
  }

  // `onDidChangeTelemetryEnabled` only seems to be available on VSCode 1.55 and above.
  // Our dependencies are currently set up for 1.54, so typescript does not understand that it exists.
  try {
    const onDidChangeTelemetryEnabled: vscode.Event<Boolean> | undefined = (
      vscode.env as any
    ).onDidChangeTelemetryEnabled;
    if (!_.isUndefined(onDidChangeTelemetryEnabled)) {
      const disposable = onDidChangeTelemetryEnabled(() =>
        instantiateSegmentClient()
      );
      ws.addDisposable(disposable);
    }
  } catch (err) {
    Logger.error({
      msg: "Error when trying to listen to the telemetry preference change event",
    });
  }
}
