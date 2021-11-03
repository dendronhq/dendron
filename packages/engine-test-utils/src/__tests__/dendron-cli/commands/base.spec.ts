import { SegmentClient, TelemetryStatus } from "@dendronhq/common-server";
import { CLICommand, CLIAnalyticsUtils } from "@dendronhq/dendron-cli";
import { TestEngineUtils } from "../../..";
import yargs from "yargs";
import Sinon from "sinon";

class DummyCLICommand extends CLICommand<any> {
  constructor() {
    super({ name: "dummy", desc: "dummy" });
    this.wsRootOptional = true;
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
  }

  async enrichArgs(opts: any) {
    return opts;
  }

  async execute(opts: any) {
    return opts;
  }
}

describe("GIVEN any command, no telemetry set before", () => {
  let dummy: CLICommand;
  beforeEach(() => {
    TestEngineUtils.mockHomeDir();
    dummy = new DummyCLICommand();
  });

  afterEach(() => {
    Sinon.restore();
  });

  test("THEN setupSegmentClient is called when executed", async () => {
    const setupSpy = Sinon.spy(dummy, "setUpSegmentClient");
    await dummy.eval({});
    expect(setupSpy.called).toBeTruthy();
  });

  test("AND notice is shown", async () => {
    const noticeSpy = Sinon.spy(CLIAnalyticsUtils, "showTelemetryMessage");
    await dummy.eval({});
    expect(noticeSpy.called).toBeTruthy();
  });

  test("AND telemetry status is set", async () => {
    await dummy.eval({});
    expect(SegmentClient.getStatus()).toEqual(
      TelemetryStatus.ENABLED_BY_CLI_DEFAULT
    );
  });
});
