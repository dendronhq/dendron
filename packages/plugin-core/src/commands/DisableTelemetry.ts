import { VSCodeEvents } from "@dendronhq/common-all";
import { SegmentClient, TelemetryStatus } from "@dendronhq/common-server";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { AnalyticsUtils } from "../utils/analytics";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class DisableTelemetryCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.DISABLE_TELEMETRY.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute() {
    const reason = TelemetryStatus.DISABLED_BY_COMMAND;
    AnalyticsUtils.track(VSCodeEvents.DisableTelemetry, { reason });
    SegmentClient.disable(reason);
    window.showInformationMessage("telemetry disabled");
  }
}
