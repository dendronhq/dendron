// ^xi5t1r2j51ot
import { ABTest } from "./abTesting";
import { GraphThemeEnum } from "./types/typesv2";

export const isABTest = (value: any): value is ABTest<any> => {
  return value instanceof ABTest;
};

/**
 * Section: Tests (Active or soon to be active)
 *
 * NOTE: please follow this convention for naming future tests:
 * YYYY-MM-TEST_NAME.  For example, 2022-04-MEETING_NOTE_FEATURE_SHOWCASE.
 *
 * See [[A/B Testing|dendron://dendron.docs/ref.ab-testing]] for more details.
 */

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

export enum QuickstartTutorialTestGroups {
  "quickstart-v1" = "quickstart-v1",
  "quickstart-with-lock" = "quickstart-with-lock",
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
      name: QuickstartTutorialTestGroups["quickstart-v1"],
      weight: 4,
    },
    {
      name: QuickstartTutorialTestGroups["quickstart-with-lock"],
      weight: 1,
    },
  ]
);

/**
 * Tutorial type of our ever-running / up to date main tutorial.
 * This should never change.
 *
 * If after an a/b test we find out that some treatment of the tutorial works better,
 * that treatment should be escalated as the "main", and be synced to the extension as such.
 */
export const MAIN_TUTORIAL_TYPE_NAME = "main";

/** ^480iitgzeq5w
 * Currently running tutorial AB test group.
 * If we are not running any A/B testing, explicitly set this to `undefined`
 */
export const CURRENT_TUTORIAL_TEST: ABTest<any> | undefined =
  _2022_06_QUICKSTART_TUTORIAL_TEST;

/** All A/B tests that are currently running.
 *
 * We apply a filter here before exporting because {@link CURRENT_TUTORIAL_TEST} can be undefined
 * when there is no active tutorial AB test running.
 * ^tkqhy45hflfd
 */
export const CURRENT_AB_TESTS = [
  GRAPH_THEME_TEST,
  CURRENT_TUTORIAL_TEST,
].filter((entry): entry is ABTest<any> => !!entry);
