import { SegmentUtils, VSCodeIdentifyProps } from "@dendronhq/common-server";
import * as Sentry from "@sentry/node";
import * as vscode from "vscode";

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
      appVersion: "1",
      userAgent: vscode.env.appName,
    }
  }

  static track(event: string, props?: any) {
    const { ideVersion, ideFlavor } = AnalyticsUtils.getVSCodeIdentifyProps();
    SegmentUtils.track(event, { type: "vscode", ideVersion, ideFlavor }, props); 
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
