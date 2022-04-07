import { ABTest } from "@dendronhq/common-server";

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
