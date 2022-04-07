import { ABTest } from "@dendronhq/common-server";

// ^xi5t1r2j51ot

export enum UpgradeToastOrViewTestEnum {
  upgradeToast = "upgradeToast",
  upgradeView = "upgradeView",
}

export const UPGRADE_TOAST_OR_VIEW_TEST = new ABTest("UpgradeToastOrViewTest", [
  {
    name: UpgradeToastOrViewTestEnum.upgradeToast,
    weight: 1,
  },
  {
    name: UpgradeToastOrViewTestEnum.upgradeView,
    weight: 1,
  },
]);

/** All A/B tests that are currently running.
 *
 * ^tkqhy45hflfd
 */
export const CURRENT_AB_TESTS = [UPGRADE_TOAST_OR_VIEW_TEST];
