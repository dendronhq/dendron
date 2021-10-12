import { CLIEvents } from "@dendronhq/common-all";
import { SegmentClient, TelemetryStatus } from "@dendronhq/common-server";
import yargs from "yargs";
import { CLIAnalyticsUtils } from "../utils/analytics";
import { CLICommand, CommandCommonProps } from "./base";


type CommandCLIOpts = {
  cmd: TelemetryCommands;
};

type CommandOpts = CommandCLIOpts & CommandCommonProps;

type CommandOutput = CommandCommonProps & { data?: any };

export enum TelemetryCommands {
  ENABLE = "enable",
  DISABLE = "disable",
  SHOW = "show",
}

export class TelemetryCLICommand extends CLICommand<CommandOpts> {
  constructor() {
    super({ name: "telemetry <cmd>", desc: "enable or disable telemetry" });
  }
  
  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    args.positional("cmd", {
      describe: "a command to run",
      choices: Object.values(TelemetryCommands),
      type: "string",
    });
  }
  
  showTelemetryEnabledMessage() {
    console.log("Telemetry is enabled.")
    console.log("Thank you for helping us improve Dendron 🌱");
  }
  
  showTelemetryDisabledMessage() {
    console.log("Telemetry is disabled.") 
  }
  
  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    return { ...args };
  }
  
  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const { cmd } = opts;
    
    try {
      switch (cmd) {
        case TelemetryCommands.ENABLE: {
          const reason = TelemetryStatus.ENABLED_BY_CLI_COMMAND;
          SegmentClient.enable(reason);
          CLIAnalyticsUtils.track(CLIEvents.CLITelemetryEnabled, { reason });
          this.showTelemetryEnabledMessage();
          break;
        }
        case TelemetryCommands.DISABLE: {
          const reason = TelemetryStatus.DISABLED_BY_CLI_COMMAND;
          SegmentClient.disable(reason);
          CLIAnalyticsUtils.track(CLIEvents.CLITelemetryDisabled, { reason });
          this.showTelemetryDisabledMessage();
          break;
        }
        case TelemetryCommands.SHOW: {
          CLIAnalyticsUtils.showTelemetryMessage();
          break;
        }
        default: {
          throw Error("bad option");
        }
      }
      return {};
    } catch (error: any) {
      this.L.error(error);
      return { error };
    }
  }
}

export { CommandOpts as TelemetryCLICommandOpts }