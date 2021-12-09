import {
  NoteTrait,
  onCreateProps,
  onWillCreateProps,
} from "@dendronhq/common-all";

/**
 * A Trait class for testing purposes
 */
export class TestTrait implements NoteTrait {
  TEST_NAME_MODIFIER = "Test Name Modifier";
  TEST_TITLE_MODIFIER = "Test Title Modifier";

  id: string = "test-trait";
  OnWillCreate: onWillCreateProps = {
    setNameModifier: () => {
      return {
        name: this.TEST_NAME_MODIFIER,
        promptUserForModification: false,
      };
    },
  };
  OnCreate: onCreateProps = {
    setTitle: () => {
      return this.TEST_TITLE_MODIFIER;
    },
  };
}
