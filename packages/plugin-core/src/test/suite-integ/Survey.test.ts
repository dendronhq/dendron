// import { DendronSurvey } from "../../survey"
import { describe } from "mocha";
import sinon from "sinon";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { TutorialInitializer } from "../../workspace/tutorialInitializer";
import { getDWorkspace } from "../../workspace";
import { StateService } from "../../services/stateService";
import { SurveyUtils } from "../../survey";

suite("SurveyUtils", function () {
  const ctx = setupBeforeAfter(this);
  describe("maybePromptInitialSurvey", () => {
    describe("GIVEN: INITIAL_SURVEY_SUBMITTED is not set", () => {
      test("THEN: maybePromptInitialSurvey is called", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async() => {},
          onInit: async () => {
            sinon.stub(StateService.instance(), "getGlobalState").resolves(undefined);
            const surveySpy = sinon.spy(SurveyUtils, "maybePromptInitialSurvey")
            const tutorialInitializer = new TutorialInitializer();
            const ws = getDWorkspace();
            await tutorialInitializer.onWorkspaceOpen({ws});
            expect(surveySpy.calledOnce).toBeTruthy();
            done();
          }
        })
      });
    });

    describe("GIVEN: INITIAL_SURVEY_SUBMITTED is set", () => {
      test("THEN: maybePromptInitialSurvey is not called", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async() => {},
          onInit: async () => {
            sinon.stub(StateService.instance(), "getGlobalState").resolves("submitted");
            const surveySpy = sinon.spy(SurveyUtils, "maybePromptInitialSurvey")
            const tutorialInitializer = new TutorialInitializer();
            const ws = getDWorkspace();
            await tutorialInitializer.onWorkspaceOpen({ws});
            expect(surveySpy.calledOnce).toBeFalsy();
            done();
          }
        })
      });
    });
  });
})