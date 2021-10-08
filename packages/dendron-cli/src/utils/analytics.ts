import { SegmentUtils } from "@dendronhq/common-server";

export class CLIAnalyticsUtils {
  static track(event: string, props?: any) {
    const cliVersion = process.env.npm_package_version!;
    SegmentUtils.track(event, { type: "cli", cliVersion }, props)
  }

  static identify() {
    const cliVersion = process.env.npm_package_version!;
    SegmentUtils.identify({ type: "cli", cliVersion });
  }
}