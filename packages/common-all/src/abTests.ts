// ^xi5t1r2j51ot
import { ABTest } from "./abTesting";
import { GraphThemeEnum } from "./types/typesv2";

/**
 * Section: Tests (Active or soon to be active)
 *
 * NOTE: please follow this convention for naming future tests:
 * YYYY-MM-TEST_NAME.  For example, 2022-04-MEETING_NOTE_FEATURE_SHOWCASE.
 *
 * See [[A/B Testing|dendron://dendron.docs/ref.ab-testing]] for more details.
 */

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

export enum QuickstartTutorialTestGroups {
  "main" = "main",
  "quickstart-v1" = "quickstart-v1",
}

/**
 * Experiment to test the impact of a short-form tutorial vs 5-step tutorial on the onboarding funnel.
 *
 * main:          full 5-step tutorial
 * quickstart-v1: one pager tutorial
 */
const _2022_06_QUICKSTART_TUTORIAL_TEST = new ABTest(
  "2022-06-QuickstartTutorialTest",
  [
    {
      name: QuickstartTutorialTestGroups["main"],
      weight: 1,
    },
    {
      name: QuickstartTutorialTestGroups["quickstart-v1"],
      weight: 1,
    },
  ]
);

export enum DailyJournalTestGroups {
  withTemplate = "withTemplate",
  withoutTemplate = "withoutTemplate",
}

/**
 * Experiment to test whether users running `Daily Journal` for the first time should get an auto-generated template/schema or not.
 *
 * withTemplate = auto-generate a template and a schema for them that will apply the template to the journal note
 * withoutTemplate = no template/schema gets generated
 */
export const _2022_05_DAILY_JOURNAL_TEMPLATE_TEST = new ABTest(
  "2022-05-DailyJournalTemplateTest",
  [
    {
      name: DailyJournalTestGroups.withTemplate,
      weight: 1,
    },
    {
      name: DailyJournalTestGroups.withoutTemplate,
      weight: 1,
    },
  ]
);

export const MAIN_TUTORIAL_GROUP_NAME = "main";

export const MAIN_TUTORIAL = new ABTest("DefaultTutorialTest", [
  {
    name: MAIN_TUTORIAL_GROUP_NAME,
    weight: 1,
  },
]);

/**
 * Currently running tutorial AB test group.
 * If we are not running any A/B testing, set this to {@link MAIN_TUTORIAL}
 */
export const CURRENT_TUTORIAL_TEST = _2022_06_QUICKSTART_TUTORIAL_TEST;

/** All A/B tests that are currently running.
 *
 * ^tkqhy45hflfd
 */
export const CURRENT_AB_TESTS = [
  GRAPH_THEME_TEST,
  GRAPH_THEME_FEATURE_SHOWCASE_TEST,
  _2022_05_DAILY_JOURNAL_TEMPLATE_TEST,
  CURRENT_TUTORIAL_TEST,
];
