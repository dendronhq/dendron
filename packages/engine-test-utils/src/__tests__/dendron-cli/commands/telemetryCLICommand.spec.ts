import { SegmentClient, TelemetryStatus } from "@dendronhq/common-server";
import { TelemetryCLICommand, TelemetryCLICommandOpts, TelemetryCommands } from "@dendronhq/dendron-cli";
import Sinon from "sinon";
import { TestEngineUtils } from "../../..";


const runCmd = (opts: TelemetryCLICommandOpts) => {
  const cmd = new TelemetryCLICommand();
  return cmd.execute(opts);
}

describe("dendron-cli telemetry <cmd>", () => {
  beforeEach(() => {
    TestEngineUtils.mockHomeDir();
  });

  afterEach(() => {
    Sinon.restore();
  });

  test("enable sets telemetry status to ENABLED_BY_CLI_COMMAND", async () => {
    const cmd = TelemetryCommands.ENABLE;
    await runCmd({ cmd });
    expect(SegmentClient.getStatus()).toEqual(TelemetryStatus.ENABLED_BY_CLI_COMMAND); 
  })

  test("disable sets telemetry status to DISABLED_BY_CLI_COMMAND", async () => {
    const cmd = TelemetryCommands.DISABLE;
    await runCmd({ cmd });
    expect(SegmentClient.getStatus()).toEqual(TelemetryStatus.DISABLED_BY_CLI_COMMAND);
  })
})