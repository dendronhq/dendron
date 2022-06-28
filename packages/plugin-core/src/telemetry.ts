import { ConfigUtils, DWorkspaceV2 } from "@dendronhq/common-all";
import { SegmentClient } from "@dendronhq/common-server";
import { Logger } from "./logger";

/** Creates a SegmentClient for telemetry, if enabled, and listens for vscode telemetry settings to disable it when requested. */
export function setupSegmentClient({
  ws,
  cachePath,
}: {
  ws?: DWorkspaceV2;
  cachePath?: string;
}) {
  try {
    const disabledByWorkspace = ws
      ? ConfigUtils.getWorkspace(ws.config).disableTelemetry
      : false;
    const segment = SegmentClient.instance({
      forceNew: true,
      cachePath,
      disabledByWorkspace,
    });
    Logger.info({ msg: `Telemetry is disabled? ${segment.hasOptedOut}` });
    Logger.info({ msg: "Segment Residual Cache Path is at " + cachePath });
  } catch (err) {
    Logger.error({
      msg: "Error when trying to listen to the telemetry preference change event",
    });
  }
}
