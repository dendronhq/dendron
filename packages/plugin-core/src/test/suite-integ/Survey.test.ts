import { describe } from "mocha";
import sinon from "sinon";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { TutorialInitializer } from "../../workspace/tutorialInitializer";
import { getDWorkspace } from "../../workspace";
import { StateService } from "../../services/stateService";
import { SurveyUtils } from "../../survey";
import { showLapsedUserMessage } from "../../_extension";
import { WSUtils } from "../../utils";
import * as vscode from "vscode";

suite("SurveyUtils", function () {
  const ctx = setupBeforeAfter(this);
  describe("showInitialSurvey", () => {
    describe("GIVEN: INITIAL_SURVEY_SUBMITTED is not set", () => {
      test("THEN: showInitialSurvey is called", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async() => {},
          onInit: async () => {
            sinon.stub(StateService.instance(), "getGlobalState").resolves(undefined);
            const surveySpy = sinon.spy(SurveyUtils, "showInitialSurvey")
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
      test("THEN: showInitialSurvey is not called", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async() => {},
          onInit: async () => {
            sinon.stub(StateService.instance(), "getGlobalState").resolves("submitted");
            const surveySpy = sinon.spy(SurveyUtils, "showInitialSurvey")
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

  describe("showLapsedUserSurvey", () => {
    describe("GIVEN: user rejects lapsed user message", () => {
      describe("WHEN: Global state for lapsed user survey isn't set", () => {
        test("THEN: showLapsedUserSurvey is called", (done) => {
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook: async () => {},
            onInit: async () => {
              sinon.stub(StateService.instance(), "getGlobalState").resolves(undefined);
              const lapsedSurveySpy = sinon.spy(SurveyUtils, "showLapsedUserSurvey");
              sinon.stub(vscode.window, "showInformationMessage").resolves({ title: "foo"});
              await showLapsedUserMessage(WSUtils.getAssetUri(ctx));
              await new Promise((resolve: any) => {
                setTimeout(() => {
                  resolve();
                }, 1);
              });
              expect(lapsedSurveySpy.calledOnce).toBeTruthy();
              done();
            }
          })
        });
      });

      describe("WHEN: Global state for lapsed user survey is set", () => {
        test("THEN: showLapsedUserSurvey is not called", (done) => {
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook: async () => {},
            onInit: async () => {
              sinon.stub(StateService.instance(), "getGlobalState").resolves("submitted");
              const lapsedSurveySpy = sinon.spy(SurveyUtils, "showLapsedUserSurvey");
              sinon.stub(vscode.window, "showInformationMessage").resolves({ title: "foo"});
              await showLapsedUserMessage(WSUtils.getAssetUri(ctx));
              await new Promise((resolve: any) => {
                setTimeout(() => {
                  resolve();
                }, 1);
              });
              expect(lapsedSurveySpy.calledOnce).toBeFalsy();
              done();
            }
          })
        });
      })
    })
  })
})