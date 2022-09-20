import {
  AppNames,
  asyncLoop,
  ContextualUIEvents,
  DWorkspaceV2,
  FOLDERS,
  genUUID,
  getStage,
  Time,
  VSCodeIdentifyProps,
} from "@dendronhq/common-all";
import { SegmentClient, SegmentUtils } from "@dendronhq/common-server";
import { MetadataService } from "@dendronhq/engine-server";
import * as Sentry from "@sentry/node";
import _ from "lodash";
import { Duration } from "luxon";
import * as vscode from "vscode";
import { VersionProvider } from "../versionProvider";
import { VSCodeUtils } from "../vsCodeUtils";
import fs from "fs-extra";
import { setupSegmentClient } from "../telemetry";
import { Logger } from "../logger";
import path from "path";
import os from "os";

export type SegmentContext = Partial<{
  app: Partial<{ name: string; version: string; build: string }>;
  os: Partial<{ name: string; version: string }>;
  userAgent: string;
}>;

export class AnalyticsUtils {
  static sessionStart = -1;

  static getVSCodeSentryRelease(): string {
    return `${AppNames.CODE}@${VersionProvider.version()}`;
  }

  static getVSCodeIdentifyProps(): VSCodeIdentifyProps {
    const {
      appName,
      appHost,
      isNewAppInstall,
      language,
      machineId,
      shell,
      isTelemetryEnabled,
    } = vscode.env;

    return {
      type: AppNames.CODE,
      ideVersion: vscode.version,
      ideFlavor: appName,
      appVersion: VersionProvider.version(),
      appHost,
      userAgent: appName,
      isNewAppInstall,
      isTelemetryEnabled,
      language,
      machineId,
      shell,
    };
  }

  static getCommonTrackProps() {
    const firstWeekSinceInstall = AnalyticsUtils.isFirstWeek();
    const vscodeSessionId = vscode.env.sessionId;
    const appVersion = VersionProvider.version();
    return {
      firstWeekSinceInstall,
      vscodeSessionId,
      appVersion,
    };
  }

  static getSessionId(): number {
    if (AnalyticsUtils.sessionStart < 0) {
      AnalyticsUtils.sessionStart = Math.round(Time.now().toSeconds());
    }
    return AnalyticsUtils.sessionStart;
  }

  static isFirstWeek() {
    const metadata = MetadataService.instance().getMeta();
    const ONE_WEEK = Duration.fromObject({ weeks: 1 });
    const firstInstallTime =
      metadata.firstInstall !== undefined
        ? Duration.fromObject({ seconds: metadata.firstInstall })
        : undefined;
    if (_.isUndefined(firstInstallTime)) {
      // `firstInstall` not set yet. by definition first week.
      return true;
    }
    const currentTime = Duration.fromObject({
      seconds: Time.now().toSeconds(),
    });
    return currentTime.minus(firstInstallTime) < ONE_WEEK;
  }

  static _trackCommon({
    event,
    props,
    timestamp,
  }: {
    event: string;
    props?: any;
    timestamp?: Date;
  }) {
    const { ideVersion, ideFlavor } = AnalyticsUtils.getVSCodeIdentifyProps();
    const properties = { ...props, ...AnalyticsUtils.getCommonTrackProps() };
    const sessionId = AnalyticsUtils.getSessionId();
    return {
      event,
      platformProps: {
        type: AppNames.CODE,
        ideVersion,
        ideFlavor,
      },
      properties,
      timestamp,
      integrations: { Amplitude: { session_id: sessionId } },
    } as Parameters<typeof SegmentUtils.track>[0];
  }

  static track(
    event: string,
    customProps?: any,
    segmentProps?: { timestamp?: Date }
  ) {
    return SegmentUtils.trackSync(
      this._trackCommon({
        event,
        props: customProps,
        timestamp: segmentProps?.timestamp,
      })
    );
  }

  /** Saves analytics to be sent during the next run of Dendron.
   *
   * Make sure any properties you use can be trivially serialized and
   * deserialized, numbers, strings, plain JSON objects, arrays are fine. No
   * Maps or complex objects.
   *
   * This is required for actions that reload the window, where the analytics
   * won't get sent in time before the reload and where delaying the reload
   * would be undesirable.
   */
  static async trackForNextRun(event: string, customProps?: any) {
    const ctx = "AnalyticsUtils.trackForNextRun";
    Logger.debug({
      ctx,
      event,
    });
    const analyticsProps = this._trackCommon({
      event,
      props: {
        ...customProps,
        savedAnalytics: true,
      },
      timestamp: new Date(),
    });
    const telemetryDir = path.join(
      os.homedir(),
      FOLDERS.DENDRON_SYSTEM_ROOT,
      FOLDERS.SAVED_TELEMETRY
    );
    await fs.ensureDir(telemetryDir);
    await fs.writeFile(
      path.join(telemetryDir, `${genUUID()}.json`),
      JSON.stringify({
        ...analyticsProps,
        timestamp: analyticsProps.timestamp?.toISOString(),
      })
    );
  }

  static async sendSavedAnalytics() {
    const ctx = "AnalyticsUtils.sendSavedAnalytics";
    Logger.info({ ctx, message: "start" });
    const telemetryDir = path.join(
      os.homedir(),
      FOLDERS.DENDRON_SYSTEM_ROOT,
      FOLDERS.SAVED_TELEMETRY
    );
    let files: string[] = [];
    try {
      files = await fs.readdir(telemetryDir);
    } catch {
      Logger.warn({
        ctx,
        msg: "failed to read the saved telemetry dir",
        telemetryDir,
      });
    }

    return asyncLoop(
      files.filter((filename) => path.extname(filename) === ".json"),
      async (filename) => {
        const filePath = path.join(telemetryDir, filename);
        try {
          const contents = await fs.readFile(filePath, { encoding: "utf-8" });
          const payload = JSON.parse(contents);
          payload.timestamp = new Date(payload.timestamp);
          await SegmentUtils.trackSync(payload);
          await fs.rm(filePath);
        } catch (err) {
          Logger.warn({
            ctx,
            msg: "failed to read or parse saved telemetry",
            filePath,
          });
        }
      }
    );
  }

  static identify(props?: Partial<VSCodeIdentifyProps>) {
    const defaultProps = AnalyticsUtils.getVSCodeIdentifyProps();
    // if partial props is passed, fill them with defaults before calling identify.
    const _props = props ? _.defaults(props, defaultProps) : defaultProps;
    SegmentUtils.identify(_props);
  }

  /**
   * Setup segment client
   * Also setup cache flushing in case of missed uploads
   */
  static setupSegmentWithCacheFlush({
    context,
    ws,
  }: {
    context: vscode.ExtensionContext;
    ws?: DWorkspaceV2;
  }) {
    if (getStage() === "prod") {
      const segmentResidualCacheDir = context.globalStorageUri.fsPath;
      fs.ensureDir(segmentResidualCacheDir);

      setupSegmentClient({
        ws,
        cachePath: path.join(
          segmentResidualCacheDir,
          "segmentresidualcache.log"
        ),
      });

      // Try to flush the Segment residual cache every hour:
      (function tryFlushSegmentCache() {
        SegmentClient.instance()
          .tryFlushResidualCache()
          .then((result) => {
            Logger.info(
              `Segment Residual Cache flush attempted. ${JSON.stringify(
                result
              )}`
            );
          });

        // Repeat once an hour:
        setTimeout(tryFlushSegmentCache, 3600000);
      })();
    }
  }

  static showTelemetryNotice() {
    vscode.window
      .showInformationMessage(
        `Dendron collects limited usage data to help improve the quality of our software`,
        "See Details",
        "Opt Out"
      )
      .then((resp) => {
        if (resp === "See Details") {
          VSCodeUtils.openLink(
            "https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html"
          );
        }
        if (resp === "Opt Out") {
          VSCodeUtils.openLink(
            "https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html#how-to-opt-out-of-data-collection"
          );
        }
      });
  }
}

/**
 * Wraps a callback function with a try/catch block.  In the catch, any
 * exceptions that were encountered will be uploaded to Sentry and then
 * rethrown.
 *
 * Warning! This function will cause the callback function to lose its `this` value.
 * If you are passing a method to this function, you must bind the `this` value:
 *
 * ```ts
 * const wrappedCallback = sentryReportingCallback(
 *   this.callback.bind(this)
 * );
 * ```
 *
 * Otherwise, when the function is called the `this` value will be undefined.
 *
 * @param callback the function to wrap
 * @returns the wrapped callback function
 */
export function sentryReportingCallback<A extends any[], R>(
  callback: (...args: A) => R
): (...args: A) => R {
  return (...args) => {
    try {
      return callback(...args);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };
}

export function getAnalyticsPayload(source?: string) {
  if (source && source === ContextualUIEvents.ContextualUICodeAction) {
    return {
      source,
    };
  }
  return {};
}
