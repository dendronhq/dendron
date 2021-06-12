import { VSCodeEvents } from "@dendronhq/common-all";
import { SegmentClient, TelemetryStatus } from "@dendronhq/common-server";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { AnalyticsUtils } from "../utils/analytics";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class EnableTelemetryCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.ENABLE_TELEMETRY.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute() {
    const reason = TelemetryStatus.ENABLED_BY_COMMAND;
    SegmentClient.enable(reason);
    AnalyticsUtils.track(VSCodeEvents.EnableTelemetry, { reason });
    window.showInformationMessage("telemetry enabled");
  }
}
