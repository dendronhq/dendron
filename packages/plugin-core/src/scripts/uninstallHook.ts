import { VSCodeEvents } from "@dendronhq/common-all";
import { SegmentClient } from "@dendronhq/common-server";

/**
 * Simple script to fire an uninstall analytics event during the
 * vscode:uninstall hook execution that runs after the extension has been
 * uninstalled. NOTE: we cannot use @see {@link AnalyticsUtils}, as that
 * requires vscode, which is unavailable during the execution of the uninstall
 * hook.
 */
async function main() {
  SegmentClient.instance().track(VSCodeEvents.Uninstall);
}

main();
