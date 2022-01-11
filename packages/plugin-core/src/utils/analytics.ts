import { ContextualUIEvents, Time } from "@dendronhq/common-all";
import { SegmentUtils, VSCodeIdentifyProps } from "@dendronhq/common-server";
import { MetadataService } from "@dendronhq/engine-server";
import * as Sentry from "@sentry/node";
import _ from "lodash";
import { Duration } from "luxon";
import * as vscode from "vscode";
import { VersionProvider } from "../versionProvider";

export type SegmentContext = Partial<{
  app: Partial<{ name: string; version: string; build: string }>;
  os: Partial<{ name: string; version: string }>;
  userAgent: string;
}>;

export class AnalyticsUtils {
  static getVSCodeIdentifyProps() {
    return {
      type: "vscode" as const,
      ideVersion: vscode.version,
      ideFlavor: vscode.env.appName,
      appVersion: VersionProvider.version(),
      userAgent: vscode.env.appName,
    };
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
    const firstWeekSinceInstall = AnalyticsUtils.isFirstWeek();
    SegmentUtils.track(
      event,
      { type: "vscode", ideVersion, ideFlavor },
      { ...props, firstWeekSinceInstall }
    );
  }

  static identify() {
    const props: VSCodeIdentifyProps = AnalyticsUtils.getVSCodeIdentifyProps();
    SegmentUtils.identify(props);
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
