import { getOS, SegmentClient } from "@dendronhq/common-server";
import { DendronWorkspace } from "../workspace";
import * as vscode from "vscode";

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
    };
  }
  static getContext(): Partial<SegmentContext> {
    return {
      app: {
        version: DendronWorkspace.version(),
      },
      os: {
        name: getOS(),
      },
      userAgent: vscode.env.appName,
    };
  }
}
