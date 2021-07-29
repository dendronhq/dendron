import { SegmentClient, TelemetryStatus } from "@dendronhq/common-server";
import { writeFileSync } from "fs-extra";
import sinon from "sinon";
import { TestEngineUtils } from "../../engine";

describe("SegmentClient", () => {
  afterEach(()=> {
    sinon.restore();
  });
  test("enabled by default", (done) => {
    // this is only for the SegmentClient, telemetry as a whole respects VSCode settings by default
    TestEngineUtils.mockHomeDir();

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(false);

    done();
  });

  test("enabled by command", (done) => {
    TestEngineUtils.mockHomeDir();
    SegmentClient.enable(TelemetryStatus.ENABLED_BY_COMMAND);

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(false);

    done();
  });

  test("enabled by config", (done) => {
    TestEngineUtils.mockHomeDir();
    SegmentClient.enable(TelemetryStatus.ENABLED_BY_CONFIG);

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(false);

    done();
  });

  test("disabled by command", (done) => {
    TestEngineUtils.mockHomeDir();
    SegmentClient.disable(TelemetryStatus.DISABLED_BY_COMMAND);

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(true);

    done();
  });

  test("disabled by vscode config", (done) => {
    TestEngineUtils.mockHomeDir();
    SegmentClient.disable(TelemetryStatus.DISABLED_BY_VSCODE_CONFIG);

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(true);

    done();
  });

  test("disabled by workspace config", (done) => {
    TestEngineUtils.mockHomeDir();
    SegmentClient.disable(TelemetryStatus.DISABLED_BY_WS_CONFIG);

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(true);

    done();
  });

  test("still recognizes legacy disable", (done) => {
    TestEngineUtils.mockHomeDir();
    const disablePath = SegmentClient.getDisableConfigPath();
    writeFileSync(disablePath, "");

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(true);

    done();
  });

  test("enable command overrides legacy disable", (done) => {
    TestEngineUtils.mockHomeDir();
    const disablePath = SegmentClient.getDisableConfigPath();
    writeFileSync(disablePath, "");

    SegmentClient.enable(TelemetryStatus.ENABLED_BY_COMMAND);
    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(false);

    done();
  });

  test("disabled then enabled with command", (done) => {
    TestEngineUtils.mockHomeDir();
    SegmentClient.disable(TelemetryStatus.DISABLED_BY_COMMAND);

    let instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(true);

    SegmentClient.enable(TelemetryStatus.ENABLED_BY_COMMAND);

    instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(false);

    done();
  });

  test("enabled then disabled with command", (done) => {
    TestEngineUtils.mockHomeDir();
    SegmentClient.enable(TelemetryStatus.ENABLED_BY_COMMAND);

    let instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(false);

    SegmentClient.disable(TelemetryStatus.DISABLED_BY_COMMAND);

    instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(true);

    done();
  });
});
