import { VSCodeEvents } from "@dendronhq/common-all";
import { SegmentClient } from "@dendronhq/common-server";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { isVSCodeTelemetryEnabled } from "../telemetry";
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
    // If telemetry is disabled in vscode settings but users asks us to enable telemetry, force enable to override vscode
    if (!isVSCodeTelemetryEnabled()) SegmentClient.forceEnable();
    SegmentClient.enable();
    AnalyticsUtils.track(VSCodeEvents.EnableTelemetry);
    window.showInformationMessage("telemetry enabled");
  }
}
