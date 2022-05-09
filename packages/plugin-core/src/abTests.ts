// ^xi5t1r2j51ot
import { GraphThemeEnum } from "@dendronhq/common-all";
import { ABTest } from "@dendronhq/common-server";

export enum UpgradeToastWordingTestGroups {
  /** The button on the upgrade toast will say "see what changed" */
  seeWhatChanged = "seeWhatChanged",
  /** The button on the upgrade toast will say "see what's new" */
  seeWhatsNew = "seeWhatsNew",
  /** The button on the upgrade toast will say "open the changelog" */
  openChangelog = "openChangelog",
}

/**
 * Section: Tests (Active or soon to be active)
 *
 * NOTE: please follow this convention for naming future tests:
 * YYYY-MM-TEST_NAME.  For example, 2022-04-MEETING_NOTE_FEATURE_SHOWCASE.
 *
 * See [[A/B Testing|dendron://dendron.docs/ref.ab-testing]] for more details.
 */

/** Test if showing a web view on an upgrade is more successful than showing a toast notification. */
export const UPGRADE_TOAST_WORDING_TEST = new ABTest(
  "UpgradeToastWordingTest",
  [
    {
      name: UpgradeToastWordingTestGroups.seeWhatChanged,
      weight: 1,
    },
    {
      name: UpgradeToastWordingTestGroups.seeWhatsNew,
      weight: 1,
    },
    {
      name: UpgradeToastWordingTestGroups.openChangelog,
      weight: 1,
    },
  ]
);

export enum SelfContainedVaultsTestGroups {
  /** User will get a regular workspace and vaults set up, like before. */
  regular = "regularVaults",
  /** User will get a self contained vault as a workspace. */
  selfContained = "selfContainedVaults",
}

export const SELF_CONTAINED_VAULTS_TEST = new ABTest(
  "SelfContainedVaultsTest",
  [
    {
      name: SelfContainedVaultsTestGroups.regular,
      weight: 1,
    },
    {
      name: SelfContainedVaultsTestGroups.selfContained,
      weight: 1,
    },
  ]
);

export enum MeetingNoteTestGroups {
  show = "show",
  noShow = "noShow",
}

export const MEETING_NOTE_TUTORIAL_TEST = new ABTest(
  "MeetingNoteTutorialTest",
  [
    {
      name: MeetingNoteTestGroups.show,
      weight: 1,
    },
    {
      name: MeetingNoteTestGroups.noShow,
      weight: 1,
    },
  ]
);

export enum GraphThemeTestGroups {
  /**
   * New user will get Monokai graph theme by default
   */
  monokai = GraphThemeEnum.Monokai,
  /**
   * New user will get Classic graph theme by default
   */
  classic = GraphThemeEnum.Classic,
  /**
   * New User will get Block theme by default
   */
  block = GraphThemeEnum.Block,
}

export const GRAPH_THEME_TEST = new ABTest("GraphThemeTest", [
  {
    name: GraphThemeTestGroups.monokai,
    weight: 1,
  },
  {
    name: GraphThemeTestGroups.classic,
    weight: 1,
  },
  {
    name: GraphThemeTestGroups.block,
    weight: 1,
  },
]);

export enum GraphThemeFeatureShowcaseTestGroups {
  showMeHow = "showMeHow",
  openGraph = "openGraphView",
}

export const GRAPH_THEME_FEATURE_SHOWCASE_TEST = new ABTest(
  "GraphThemeFeatureShowcaseTest",
  [
    {
      name: GraphThemeFeatureShowcaseTestGroups.openGraph,
      weight: 1,
    },
    {
      name: GraphThemeFeatureShowcaseTestGroups.showMeHow,
      weight: 1,
    },
  ]
);

export enum GraphThemeTestGroups {
  /**
   * New user will get Monokai graph theme by default
   */
  monokai = GraphThemeEnum.Monokai,
  /**
   * New user will get Classic graph theme by default
   */
  classic = GraphThemeEnum.Classic,
  /**
   * New User will get Block theme by default
   */
  block = GraphThemeEnum.Block,
}

export const GRAPH_THEME_TEST = new ABTest("GraphThemeTest", [
  {
    name: GraphThemeTestGroups.monokai,
    weight: 1,
  },
  {
    name: GraphThemeTestGroups.classic,
    weight: 1,
  },
  {
    name: GraphThemeTestGroups.block,
    weight: 1,
  },
]);

export enum GraphThemeFeatureShowcaseTestGroups {
  showMeHow = "showMeHow",
  openGraph = "openGraphView",
}

export const GRAPH_THEME_FEATURE_SHOWCASE_TEST = new ABTest(
  "GraphThemeFeatureShowcaseTest",
  [
    {
      name: GraphThemeFeatureShowcaseTestGroups.openGraph,
      weight: 1,
    },
    {
      name: GraphThemeFeatureShowcaseTestGroups.showMeHow,
      weight: 1,
    },
  ]
);

/** All A/B tests that are currently running.
 *
 * ^tkqhy45hflfd
 */
export const CURRENT_AB_TESTS = [
  UPGRADE_TOAST_WORDING_TEST,
  SELF_CONTAINED_VAULTS_TEST,
  MEETING_NOTE_TUTORIAL_TEST,
  MEETING_NOTE_FEATURE_SHOWCASE_TEST,
  GRAPH_THEME_TEST,
  GRAPH_THEME_FEATURE_SHOWCASE_TEST,
];
