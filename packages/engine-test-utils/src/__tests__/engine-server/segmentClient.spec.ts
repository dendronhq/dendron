import { DendronError, RespV2 } from "@dendronhq/common-all";
import {
  SegmentClient,
  SegmentEventProps,
  TelemetryStatus,
  tmpDir
} from "@dendronhq/common-server";
import fs, { writeFileSync } from "fs-extra";
import path from "path";
import sinon from "sinon";
import { TestEngineUtils } from "../../engine";

describe("SegmentClient", () => {
  afterEach(() => {
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

  describe("WHEN: Enabled by CLI command", () => {
    test("THEN: recognized as enabled", (done) => {
      TestEngineUtils.mockHomeDir();
      SegmentClient.enable(TelemetryStatus.ENABLED_BY_CLI_COMMAND);
      const instance = SegmentClient.instance({ forceNew: true });
      expect(instance.hasOptedOut).toBeFalsy();
      done();
    });
  });

  describe("WHEN: Disabled by CLI command", () => {
    test("THEN: recognized as disabled", (done) => {
      TestEngineUtils.mockHomeDir();
      SegmentClient.disable(TelemetryStatus.DISABLED_BY_CLI_COMMAND);
      const instance = SegmentClient.instance({ forceNew: true });
      expect(instance.hasOptedOut).toBeTruthy();
      done();
    });
  });

  describe("WHEN: Enabled by CLI as default", () => {
    test("THEN: recognized as enabled", (done) => {
      TestEngineUtils.mockHomeDir();
      SegmentClient.enable(TelemetryStatus.ENABLED_BY_CLI_DEFAULT);
      const instance = SegmentClient.instance({ forceNew: true });
      expect(instance.hasOptedOut).toBeFalsy();
      done();
    })
  })
});

type flushResponse = {
  successCount: number,
  nonRetryableErrorCount: number,
  retryableErrorCount: number
}

describe("GIVEN a SegmentClient", () => {
  const filepath = path.join(tmpDir().name, "test.log");

  const instance = SegmentClient.instance({
    forceNew: true,
    cachePath: filepath,
  });

  const payloadThatWillSend = {
    event: "mockWillSend",
    properties: {
      hello: "world",
    },
  };

  const payloadThatWillNotSend = {
    event: "mockFailToSend",
    properties: {
      hello: "world",
    },
  };

  const invalidPayload = "this is invalid JSON";

  function mockedTrackInternal(
    event: string,
    _context: any,
    _payload: { [key: string]: any },
    _timestamp?: Date
  ): Promise<RespV2<SegmentEventProps>> {
    return new Promise<RespV2<SegmentEventProps>>((resolve) => {
      if (event === "mockFailToSend") {
        resolve({
          error: new DendronError({
            message: "Mock - Failed to send event " + event,
          }),
        });
      } else {
        resolve({ error: null });
      }
    });
  }

  beforeEach(() => {
    sinon.stub(instance, <any>"trackInternal").callsFake(mockedTrackInternal);
  });
  
  afterEach(() => {
    sinon.restore();
  });

  describe("WHEN we track an event and we can connect to Segment backend", () => {
    beforeEach(async () => {
      await instance.track("mockWillSend", {
        hello: "world",
      },);
    });

    afterEach(() => {
      if (fs.pathExistsSync(filepath)) {
        fs.removeSync(filepath);
      }
    });

    test("THEN residual cache should be empty", async (done) => {
      expect(fs.pathExistsSync(filepath)).toBeFalsy();
      done();
    });
  });

  describe("WHEN we track an event but we cannot connect to Segment backend", () => {
    beforeEach(async () => {
      await instance.track("mockFailToSend", {
        hello: "world",
      },);
    });

    afterEach(() => {
      if (fs.pathExistsSync(filepath)) {
        fs.removeSync(filepath);
      }
    });

    test("THEN residual cache should be non-empty", async (done) => {
      const fileContents = fs.readFileSync(filepath, 'utf-8');
      expect(fileContents).toMatchSnapshot();
      done();
    });
  });

  describe("WHEN a valid payload exists and we try to flush it while we can connect to Segment backend", () => {
    let results: flushResponse;

    beforeEach(async () => {
      await instance.writeToResidualCache(filepath, payloadThatWillSend);
      results = await instance.tryFlushResidualCache();
    })

    afterEach(() => {
      if (fs.pathExistsSync(filepath)) {
        fs.removeSync(filepath);
      }
    });

    test("THEN data should be sent", (done) => {
      expect(results.successCount).toEqual(1);
      expect(results.nonRetryableErrorCount).toEqual(0);
      expect(results.retryableErrorCount).toEqual(0);
      done();
    });

    test("AND the file should be empty afterward", async (done) => {
      const fileContents = fs.readFileSync(filepath, 'utf-8');
      expect(fileContents).toEqual('');
      done();
    });
  });

  describe("WHEN a valid payload exists and we try to flush it but we cannot connect to Segment backend", () => {
    let results: flushResponse;

    beforeEach(async () => {
      await instance.writeToResidualCache(filepath, payloadThatWillNotSend);
      results = await instance.tryFlushResidualCache();
    });

    afterEach(() => {
      if (fs.pathExistsSync(filepath)) {
        fs.removeSync(filepath);
      }
    });

    test("THEN data should not be sent", async (done) => {
      expect(results.successCount).toEqual(0);
      expect(results.nonRetryableErrorCount).toEqual(0);
      expect(results.retryableErrorCount).toEqual(1);
      done();
    });

    test("AND the file should keep the payload contents (for a later retry)", async (done) => {
      const fileContents = fs.readFileSync(filepath, 'utf-8');
      expect(fileContents).toMatchSnapshot();

      done();
    });
  });

  describe("WHEN an unparsable payload exists and we try to flush it", () => {
    let results: flushResponse;

    beforeEach(async () => {
      await instance.writeToResidualCache(
        filepath,
        invalidPayload as unknown as SegmentEventProps
      );

      results = await instance.tryFlushResidualCache();
    });

    afterEach(() => {
      if (fs.pathExistsSync(filepath)) {
        fs.removeSync(filepath);
      }
    });

    test("THEN data should not be sent", async (done) => {
      expect(results.successCount).toEqual(0);
      expect(results.nonRetryableErrorCount).toEqual(1);
      expect(results.retryableErrorCount).toEqual(0);
      done();
    });

    test("AND the file should still be empty afterward (not worth retrying unparsable data)", (done) => {
      const fileContents = fs.readFileSync(filepath, 'utf-8');
      expect(fileContents).toEqual('');
      done();
    });
  });

  describe("WHEN a valid payload exists and we try to flush it, some data can get sent but some doesn't (flaky connection)", () => {
    let results: flushResponse;

    beforeEach(async () => {
      await instance.writeToResidualCache(
        filepath,
        invalidPayload as unknown as SegmentEventProps
      );

      await instance.writeToResidualCache(filepath, payloadThatWillSend);
      await instance.writeToResidualCache(filepath, payloadThatWillNotSend);

      results = await instance.tryFlushResidualCache();
    })

    afterEach(() => {
      if (fs.pathExistsSync(filepath)) {
        fs.removeSync(filepath);
      }
    });

    test("THEN some data should be sent", (done) => {
      expect(results.successCount).toEqual(1);
      expect(results.nonRetryableErrorCount).toEqual(1);
      expect(results.retryableErrorCount).toEqual(1);
      done();
    });

    test("AND the file should keep the payload contents of ONLY data that was not sent", (done) => {
      const fileContents = fs.readFileSync(filepath, 'utf-8');
      expect(fileContents).toMatchSnapshot();
      done();
    });
  });
});