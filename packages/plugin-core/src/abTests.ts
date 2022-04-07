// ^xi5t1r2j51ot
import { ABTest } from "@dendronhq/common-server";

export enum UpgradeToastOrViewTestGroups {
  /** Users who get a toast notification in the corner of VSCode. */
  upgradeToast = "upgradeToast",
  /** Users who get a upgrade webview pop up.  */
  upgradeView = "upgradeView",
}

/** Test if showing a web view on an upgrade is more successful than showing a toast notification. */
export const UPGRADE_TOAST_OR_VIEW_TEST = new ABTest("UpgradeToastOrViewTest", [
  {
    name: UpgradeToastOrViewTestGroups.upgradeToast,
    weight: 1,
  },
  {
    name: UpgradeToastOrViewTestGroups.upgradeView,
    weight: 1,
  },
]);

/** All A/B tests that are currently running.
 *
 * ^tkqhy45hflfd
 */
export const CURRENT_AB_TESTS = [UPGRADE_TOAST_OR_VIEW_TEST];
