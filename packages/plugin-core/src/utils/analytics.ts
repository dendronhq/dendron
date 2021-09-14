import { getOS, SegmentClient } from "@dendronhq/common-server";
import * as Sentry from "@sentry/node";
import * as vscode from "vscode";
import { DendronExtension } from "../workspace";

export type SegmentContext = Partial<{
  app: Partial<{ name: string; version: string; build: string }>;
  os: Partial<{ name: string; version: string }>;
  userAgent: string;
}>;

export class AnalyticsUtils {
  static track(event: string, props?: any) {
    SegmentClient.instance().track(
      event,
      {
        ...props,
        ...AnalyticsUtils.getCommonProps(),
      },
      {
        context: AnalyticsUtils.getContext(),
      }
    );
  }

  static identify() {
    SegmentClient.instance().identifyAnonymous(
      {
        ...AnalyticsUtils.getCommonProps(),
      },
      {
        context: AnalyticsUtils.getContext(),
      }
    );
  }

  static getCommonProps() {
    return {
      arch: process.arch,
      nodeVersion: process.version,
      ideVersion: vscode.version,
      ideFlavor: vscode.env.appName,
    };
  }
  static getContext(): Partial<SegmentContext> {
    return {
      app: {
        version: DendronExtension.version(),
      },
      os: {
        name: getOS(),
      },
      userAgent: vscode.env.appName,
    };
  }
}

/**
 * Wraps a callback function with a try/catch block.  In the catch, any
 * exceptions that were encountered will be uploaded to Sentry and then
 * rethrown.
 * @param callback the function to wrap
 * @returns the wrapped callback function
 */
export function sentryReportingCallback(
  callback: (...args: any[]) => any
): (...args: any[]) => any {
  return (...args) => {
    try {
      return callback(...args);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };
}
