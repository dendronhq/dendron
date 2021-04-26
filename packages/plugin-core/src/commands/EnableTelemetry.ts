import { VSCodeEvents } from "@dendronhq/common-all";
import { SegmentClient } from "@dendronhq/common-server";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
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
    SegmentClient.enable();
    SegmentClient.instance().track(VSCodeEvents.EnableTelemetry);
    window.showInformationMessage("telemetry enabled");
  }
}
