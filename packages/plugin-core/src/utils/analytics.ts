import { ContextualUIEvents, Time } from "@dendronhq/common-all";
import { SegmentUtils, VSCodeIdentifyProps } from "@dendronhq/common-server";
import { MetadataService } from "@dendronhq/engine-server";
import * as Sentry from "@sentry/node";
import _ from "lodash";
import { Duration } from "luxon";
import * as vscode from "vscode";
import { VersionProvider } from "../versionProvider";
import { VSCodeUtils } from "../vsCodeUtils";

export type SegmentContext = Partial<{
  app: Partial<{ name: string; version: string; build: string }>;
  os: Partial<{ name: string; version: string }>;
  userAgent: string;
}>;

export class AnalyticsUtils {
  static sessionStart = -1;

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
      type: "vscode" as const,
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
        type: "vscode",
        ideVersion,
        ideFlavor,
      },
      properties,
      integrations: { Amplitude: { session_id: sessionId } },
    });
  }

  static identify() {
    const props: VSCodeIdentifyProps = AnalyticsUtils.getVSCodeIdentifyProps();
    SegmentUtils.identify(props);
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
