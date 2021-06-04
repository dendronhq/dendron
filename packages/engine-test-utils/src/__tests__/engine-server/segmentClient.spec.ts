import { SegmentClient, tmpDir } from "@dendronhq/common-server";
import sinon from "sinon";
import os from "os";

function mockHome() {
  const tmpHome = tmpDir().name;
  sinon.stub(os, "homedir").returns(tmpHome);
}

describe("SegmentClient", () => {
  test("enabled", (done) => {
    mockHome();
    SegmentClient.enable();
    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance._hasOptedOut).toEqual(false);

    sinon.restore();
    done();
  });

  test("disabled by user", (done) => {
    mockHome();
    SegmentClient.disable();
    const instance = SegmentClient.instance({ forceNew: true });
    expect(instance._hasOptedOut).toEqual(true);

    sinon.restore();
    done();
  });

  test("disabled by config", (done) => {
    mockHome();
    SegmentClient.enable();
    const instance = SegmentClient.instance({ forceNew: true, optOut: true });
    expect(instance._hasOptedOut).toEqual(true);

    sinon.restore();
    done();
  });

  test("force enabled by user", (done) => {
    mockHome();
    SegmentClient.forceEnable();
    const instance = SegmentClient.instance({ forceNew: true, optOut: true });
    expect(instance._hasOptedOut).toEqual(false);

    sinon.restore();
    done();
  });
});
