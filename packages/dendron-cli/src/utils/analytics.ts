import { RuntimeUtils } from "@dendronhq/common-all";
import { SegmentUtils } from "@dendronhq/common-server";
import { CLIUtils } from "./cli";

export class CLIAnalyticsUtils {
  static track(event: string, props?: any) {
    const cliVersion = CLIUtils.getClientVersion();
    SegmentUtils.track({
      event,
      platformProps: { type: "cli", cliVersion },
      properties: props,
    });
  }

  static async trackSync(event: string, props?: any) {
    const cliVersion = CLIUtils.getClientVersion();
    await SegmentUtils.trackSync({
      event,
      platformProps: { type: "cli", cliVersion },
      properties: props,
    });
  }

  static identify() {
    const cliVersion = CLIUtils.getClientVersion();
    SegmentUtils.identify({ type: "cli", cliVersion });
  }

  /**
   * Show notice about telemetry
   */
  static showTelemetryMessage() {
    if (RuntimeUtils.isRunningInTestOrCI()) {
      return;
    }
    const message = [
      "Dendron collects limited usage data to help improve the quality of our software.",
      "",
      "You can learn everything about our telemetry policies by visiting the following link: ",
      "https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html",
      "",
      "If you would like to opt out, follow the instructions below: ",
      "https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html#how-to-opt-out-of-data-collection",
    ].join("\n");
    const header = `\n===================\nTelemetry notice 🌱\n===================\n`;
    const container = `${header}${message}`;
    // eslint-disable-next-line no-console
    console.log(container);
  }
}
