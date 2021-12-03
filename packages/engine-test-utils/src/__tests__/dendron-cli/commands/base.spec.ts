import {
  SegmentClient,
  SegmentUtils,
  TelemetryStatus,
} from "@dendronhq/common-server";
import { CLICommand, CLIAnalyticsUtils } from "@dendronhq/dendron-cli";
import { TestEngineUtils } from "../../..";
import yargs from "yargs";
import sinon from "sinon";

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

  // @ts-ignore;
  async execute(opts: any) {
    // @ts-ignore;
    return { data: opts };
  }
}

describe("GIVEN any command, no telemetry set before", () => {
  let dummy: CLICommand;
  beforeEach(() => {
    TestEngineUtils.mockHomeDir();
    // @ts-ignore;
    dummy = new DummyCLICommand();
  });

  afterEach(() => {
    sinon.restore();
  });

  test("THEN setupSegmentClient is called when executed", async () => {
    const setupSpy = sinon.spy(dummy, "setUpSegmentClient");
    await dummy.eval({});
    expect(setupSpy.called).toBeTruthy();
  });

  test("AND notice is shown", async () => {
    const noticeSpy = sinon.spy(CLIAnalyticsUtils, "showTelemetryMessage");
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

describe("CLIAnalyticsUtils", () => {
  describe("GIVEN GITHUB_ACTIONS === true", () => {
    beforeEach(() => {
      process.env.GITHUB_ACTIONS = "true";
    });
    afterEach(() => {
      delete process.env.GITHUB_ACTIONS;
    });
    test("THEN SegmentUtils.track is not called", (done) => {
      const trackSpy = sinon.spy(SegmentUtils, "track");
      CLIAnalyticsUtils.track("dummy", { dummy: true });

      expect(trackSpy.called).toBeFalsy();
      trackSpy.restore();
      done();
    });

    test("THEN SegmentUtils.trackSync is not called", async (done) => {
      const trackSyncSpy = sinon.spy(SegmentUtils, "trackSync");
      await CLIAnalyticsUtils.trackSync("dummy", { dummy: true });

      expect(trackSyncSpy.called).toBeFalsy();
      trackSyncSpy.restore();
      done();
    });
  });

  describe("GIVEN GITHUB_ACTIONS is not set", () => {
    beforeEach(() => {
      delete process.env.GITHUB_ACTIONS;
    });

    test("THEN SegmentUtils.track is called", (done) => {
      const fakeTrack = sinon.stub(SegmentUtils, "track").callsFake(() => {});
      CLIAnalyticsUtils.track("dummy", { dummy: true });
      expect(fakeTrack.called).toBeTruthy();
      fakeTrack.restore();
      done();
    });

    test("THEN SegmentUtils.trackSync is called", async (done) => {
      const fakeTrackSync = sinon
        .stub(SegmentUtils, "trackSync")
        .callsFake(async () => {});
      await CLIAnalyticsUtils.trackSync("dummy", { dummy: true });
      expect(fakeTrackSync.called).toBeTruthy();
      fakeTrackSync.restore();
      done();
    });
  });
});
