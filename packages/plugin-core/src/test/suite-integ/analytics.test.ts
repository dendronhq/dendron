import { describe, before, after, test } from "mocha";
import { AnalyticsUtils } from "../../utils/analytics";
import { expect } from "../expect";
import os from "os";
import { SegmentUtils, tmpDir } from "@dendronhq/common-server";
import path from "path";
import { FOLDERS } from "@dendronhq/common-all";
import fs from "fs-extra";
import sinon from "sinon";
import _ from "lodash";

describe("GIVEN AnalyticsUtils", () => {
  describe("WHEN getSessionId called twice", () => {
    test("THEN get same value", () => {
      const val1 = AnalyticsUtils.getSessionId();
      const val2 = AnalyticsUtils.getSessionId();
      expect(val1).toNotEqual(-1);
      expect(val1).toEqual(val2);
    });
  });

  describe("WHEN trackForNextRun is used", () => {
    const event = "TestEventOccurred";
    const numbers = [1, 1, 2, 3, 5, 8];
    const namesYears = {
      "Jeffrey David Ullman": 2020,
      "Jack Dongarra": 2021,
    };

    let homedir: string;
    before(async () => {
      homedir = tmpDir().name;
      sinon.stub(os, "homedir").returns(homedir);

      await AnalyticsUtils.trackForNextRun(event, {
        numbers,
        namesYears,
      });
    });
    after(() => {
      sinon.restore();
    });

    test("THEN the properties are saved to disk", async () => {
      const telemetryDir = path.join(
        homedir,
        FOLDERS.DENDRON_SYSTEM_ROOT,
        FOLDERS.SAVED_TELEMETRY
      );
      const savedFiles = (await fs.readdir(telemetryDir)).filter(
        (filename) => path.extname(filename) === ".json"
      );
      expect(savedFiles.length).toEqual(1);
      const contents = await fs.readFile(
        path.join(telemetryDir, savedFiles[0]),
        { encoding: "utf-8" }
      );
      expect(contents.includes(event)).toBeTruthy();
      expect(contents.includes("5")).toBeTruthy();
      expect(contents.includes("8")).toBeTruthy();
      expect(contents.includes("Jeffrey David Ullman")).toBeTruthy();
      expect(contents.includes("Jack Dongarra")).toBeTruthy();
      expect(contents.includes("timestamp")).toBeTruthy();
    });

    describe("AND when sendSavedAnalytics is used", () => {
      let trackStub: sinon.SinonStub<
        Parameters<typeof SegmentUtils["trackSync"]>
      >;
      before(async () => {
        trackStub = sinon.stub(SegmentUtils, "trackSync");
        await AnalyticsUtils.sendSavedAnalytics();
      });
      after(() => {
        trackStub.restore();
      });

      test("THEN the saved event is sent", async () => {
        expect(trackStub.calledOnce).toBeTruthy();
        const args = trackStub.args[0][0];
        // Should be the right event
        expect(args.event).toEqual(event);
        // All the props should match
        expect(_.isEqual(args.properties?.numbers, numbers)).toBeTruthy();
        expect(_.isEqual(args.properties?.namesYears, namesYears)).toBeTruthy();
        // Timestamp should be serialzed and saved, then parsed on load
        expect(args.timestamp instanceof Date).toBeTruthy();
      });
    });
  });
});
