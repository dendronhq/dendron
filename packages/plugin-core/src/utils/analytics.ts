import {
  AppNames,
  ContextualUIEvents,
  DWorkspaceV2,
  getStage,
  Time,
} from "@dendronhq/common-all";
import {
  SegmentClient,
  SegmentUtils,
  VSCodeIdentifyProps,
} from "@dendronhq/common-server";
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
    return {
      firstWeekSinceInstall,
      vscodeSessionId,
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

  static track(event: string, props?: any) {
    const { ideVersion, ideFlavor } = AnalyticsUtils.getVSCodeIdentifyProps();
    const properties = { ...props, ...AnalyticsUtils.getCommonTrackProps() };
    const sessionId = AnalyticsUtils.getSessionId();
    SegmentUtils.track({
      event,
      platformProps: {
        type: AppNames.CODE,
        ideVersion,
        ideFlavor,
      },
      properties,
      integrations: { Amplitude: { session_id: sessionId } },
    });
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
    ws: DWorkspaceV2;
  }) {
    if (getStage() === "prod") {
      const segmentResidualCacheDir = context.globalStorageUri.fsPath;
      fs.ensureDir(segmentResidualCacheDir);

      setupSegmentClient(
        ws,
        path.join(segmentResidualCacheDir, "segmentresidualcache.log")
      );

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
