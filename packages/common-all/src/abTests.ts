// ^xi5t1r2j51ot
import { ABTest } from "./abTesting";
import { GraphThemeEnum } from "./types/typesv2";

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

/**
 *
 * These enums correspond to the alt treatment hierarchy, and will have to match
 * in order to be synced correctly / loaded by the tutorial initializer.
 *
 * e.g.)
 *  1. in `dendron-site`, prepare tutorials in `tutorial.main.*`, `tutorial.my-treatment-1.*`, and `tutorial.my-treatment-2.*`,
 *  2. in this case, the enum kvps should match the second level hierarchy:
 *     export enum TutorialTestGroups {
 *       "main" = "main",
 *       "my-treatment-1" = "my-treatment-1",
 *       "my-treatment-2" = "my-treatment-2"
 *     }
 */
export enum TutorialTestGroups {
  "main" = "main", // shows main tutorial
  "no-refactor" = "no-refactor", // shows main tutorial, minus mentions to refactoring
  "original" = "original", // shows old (origianl) tutorial
}

/**
 * Long running A/B test for differently treated tutorials.
 * See instructions for how to set up treatments in the comments for {@link TutorialTestGroups}
 *
 * Currently running test:
 *   - old tutorial (including meeting note mention) as baseline
 *   - one group that will get the updated tutorial that is presented in our wiki
 *   - one group that will get the updated tutorial that is presented in our wiki, minus the mentions to refactoring.
 */
export const AB_TUTORIAL_TEST = new ABTest("AB_TUTORIAL_TEST", [
  {
    name: TutorialTestGroups["main"],
    weight: 1,
  },
  {
    name: TutorialTestGroups["no-refactor"],
    weight: 1,
  },
  {
    name: TutorialTestGroups["original"],
    weight: 1,
  },
]);

/** All A/B tests that are currently running.
 *
 * ^tkqhy45hflfd
 */
export const CURRENT_AB_TESTS = [
  UPGRADE_TOAST_WORDING_TEST,
  SELF_CONTAINED_VAULTS_TEST,
  GRAPH_THEME_TEST,
  GRAPH_THEME_FEATURE_SHOWCASE_TEST,
  AB_TUTORIAL_TEST,
];
