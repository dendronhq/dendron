import { SegmentClient, TelemetryStatus } from "@dendronhq/common-server";
import { FileTestUtils } from "@dendronhq/common-test-utils";
import { writeFileSync } from "fs-extra";

describe("SegmentClient", () => {
  test("enabled by default", (done) => {
    // this is only for the SegmentClient, telemetry as a whole respects VSCode settings by default
    const { stub, tmpHome: _tmpHome } = FileTestUtils.mockHome();

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(false);

    stub.restore();
    done();
  });

  test("enabled by command", (done) => {
    const { stub, tmpHome: _tmpHome } = FileTestUtils.mockHome();
    SegmentClient.enable(TelemetryStatus.ENABLED_BY_COMMAND);

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(false);

    stub.restore();
    done();
  });

  test("enabled by config", (done) => {
    const { stub, tmpHome: _tmpHome } = FileTestUtils.mockHome();
    SegmentClient.enable(TelemetryStatus.ENABLED_BY_CONFIG);

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(false);

    stub.restore();
    done();
  });

  test("disabled by command", (done) => {
    const { stub, tmpHome: _tmpHome } = FileTestUtils.mockHome();
    SegmentClient.disable(TelemetryStatus.DISABLED_BY_COMMAND);

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(true);

    stub.restore();
    done();
  });

  test("disabled by vscode config", (done) => {
    const { stub, tmpHome: _tmpHome } = FileTestUtils.mockHome();
    SegmentClient.disable(TelemetryStatus.DISABLED_BY_VSCODE_CONFIG);

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(true);

    stub.restore();
    done();
  });

  test("disabled by workspace config", (done) => {
    const { stub, tmpHome: _tmpHome } = FileTestUtils.mockHome();
    SegmentClient.disable(TelemetryStatus.DISABLED_BY_WS_CONFIG);

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(true);

    stub.restore();
    done();
  });

  test("still recognizes legacy disable", (done) => {
    const { stub, tmpHome: _tmpHome } = FileTestUtils.mockHome();
    const disablePath = SegmentClient.getDisableConfigPath();
    writeFileSync(disablePath, "");

    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(true);

    stub.restore();
    done();
  });

  test("enable command overrides legacy disable", (done) => {
    const { stub, tmpHome: _tmpHome } = FileTestUtils.mockHome();
    const disablePath = SegmentClient.getDisableConfigPath();
    writeFileSync(disablePath, "");

    SegmentClient.enable(TelemetryStatus.ENABLED_BY_COMMAND);
    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance.hasOptedOut).toEqual(false);

    stub.restore();
    done();
  });
});
