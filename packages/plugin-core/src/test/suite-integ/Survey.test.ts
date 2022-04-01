import {
  InitialSurveyStatusEnum,
  MetadataService,
} from "@dendronhq/engine-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import { describe, after, beforeEach, afterEach } from "mocha";
import sinon, { SinonStub, SinonSpy } from "sinon";
import * as vscode from "vscode";
import { GLOBAL_STATE } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { StateService } from "../../services/stateService";
import { SurveyUtils } from "../../survey";
import { VSCodeUtils } from "../../vsCodeUtils";
import { TutorialInitializer } from "../../workspace/tutorialInitializer";
import { showLapsedUserMessage } from "../../_extension";
import { expect, resetCodeWorkspace } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

suite("SurveyUtils", function () {
  describe("showInitialSurvey", () => {
    let homeDirStub: SinonStub;
    let stateStub: SinonStub;
    let surveySpy: SinonSpy;
    describeMultiWS(
      "GIVEN INITIAL_SURVEY_SUBMITTED is not set",
      {
        beforeHook: async () => {
          await resetCodeWorkspace();
          homeDirStub = TestEngineUtils.mockHomeDir();
        },
      },
      () => {
        after(() => {
          homeDirStub.restore();
        });

        beforeEach(() => {
          stateStub = sinon
            .stub(StateService.instance(), "getGlobalState")
            .resolves(undefined);
          surveySpy = sinon.spy(SurveyUtils, "showInitialSurvey");
        });

        afterEach(() => {
          stateStub.restore();
          surveySpy.restore();
        });

        describe("AND initialSurveyStatus is not set", () => {
          test("THEN showInitialSurvey is called", async () => {
            const tutorialInitializer = new TutorialInitializer();
            const ws = ExtensionProvider.getDWorkspace();
            expect(
              MetadataService.instance().getMeta().initialSurveyStatus
            ).toEqual(undefined);
            expect(
              await StateService.instance().getGlobalState(
                GLOBAL_STATE.INITIAL_SURVEY_SUBMITTED
              )
            ).toEqual(undefined);
            await tutorialInitializer.onWorkspaceOpen({ ws });
            expect(surveySpy.calledOnce).toBeTruthy();
          });
        });

        describe("AND initialSurveyStatus is set to cancelled", () => {
          test("THEN showInitialSurvey is called", async () => {
            const tutorialInitializer = new TutorialInitializer();
            const ws = ExtensionProvider.getDWorkspace();
            MetadataService.instance().setInitialSurveyStatus(
              InitialSurveyStatusEnum.cancelled
            );
            expect(
              await StateService.instance().getGlobalState(
                GLOBAL_STATE.INITIAL_SURVEY_SUBMITTED
              )
            ).toEqual(undefined);
            await tutorialInitializer.onWorkspaceOpen({ ws });
            expect(surveySpy.calledOnce).toBeTruthy();
          });
        });

        describe("AND initialSurveyStatus is set to submitted", () => {
          test("THEN showInitialSurvey is not called", async () => {
            const tutorialInitializer = new TutorialInitializer();
            const ws = ExtensionProvider.getDWorkspace();
            MetadataService.instance().setInitialSurveyStatus(
              InitialSurveyStatusEnum.submitted
            );
            expect(
              await StateService.instance().getGlobalState(
                GLOBAL_STATE.INITIAL_SURVEY_SUBMITTED
              )
            ).toEqual(undefined);
            await tutorialInitializer.onWorkspaceOpen({ ws });
            expect(surveySpy.calledOnce).toBeFalsy();
          });
        });
      }
    );

    describeMultiWS(
      "GIVEN INITIAL_SURVEY_SUBMITTED is set",
      {
        beforeHook: async () => {
          await resetCodeWorkspace();
          homeDirStub = TestEngineUtils.mockHomeDir();
        },
      },
      () => {
        after(() => {
          homeDirStub.restore();
        });

        beforeEach(() => {
          stateStub = sinon
            .stub(StateService.instance(), "getGlobalState")
            .resolves("submitted");
          surveySpy = sinon.spy(SurveyUtils, "showInitialSurvey");
        });

        afterEach(() => {
          stateStub.restore();
          surveySpy.restore();
        });

        describe("AND initialSurveyStatus is not set", () => {
          test("THEN metadata is backfilled AND showInitialSurvey is not called", async () => {
            const tutorialInitializer = new TutorialInitializer();
            const ws = ExtensionProvider.getDWorkspace();
            // metadata is not set yet, we expect this to be backfilled
            expect(
              MetadataService.instance().getMeta().initialSurveyStatus
            ).toEqual(undefined);
            // global state is already set.
            expect(
              await StateService.instance().getGlobalState(
                GLOBAL_STATE.INITIAL_SURVEY_SUBMITTED
              )
            ).toEqual("submitted");

            await tutorialInitializer.onWorkspaceOpen({ ws });

            expect(surveySpy.calledOnce).toBeFalsy();

            // metadata is backfilled.
            expect(
              MetadataService.instance().getMeta().initialSurveyStatus
            ).toEqual(InitialSurveyStatusEnum.submitted);
          });
        });

        describe("AND initialSurveyStatus is set to submitted", () => {
          test("THEN showInitialSurvey is not called", async () => {
            const tutorialInitializer = new TutorialInitializer();
            const ws = ExtensionProvider.getDWorkspace();

            MetadataService.instance().setInitialSurveyStatus(
              InitialSurveyStatusEnum.submitted
            );
            expect(
              await StateService.instance().getGlobalState(
                GLOBAL_STATE.INITIAL_SURVEY_SUBMITTED
              )
            ).toEqual("submitted");
            await tutorialInitializer.onWorkspaceOpen({ ws });
            expect(surveySpy.calledOnce).toBeFalsy();
          });
        });
      }
    );
  });

  describe("showLapsedUserSurvey", () => {
    const ctx = setupBeforeAfter(this);
    describe("GIVEN: user rejects lapsed user message", () => {
      describe("WHEN: Global state for lapsed user survey isn't set", () => {
        test("THEN: showLapsedUserSurvey is called", (done) => {
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook: async () => {},
            onInit: async () => {
              sinon
                .stub(StateService.instance(), "getGlobalState")
                .resolves(undefined);
              const lapsedSurveySpy = sinon.spy(
                SurveyUtils,
                "showLapsedUserSurvey"
              );
              sinon
                .stub(vscode.window, "showInformationMessage")
                .resolves({ title: "foo" });
              await showLapsedUserMessage(VSCodeUtils.getAssetUri(ctx));
              await new Promise((resolve: any) => {
                setTimeout(() => {
                  resolve();
                }, 1);
              });
              expect(lapsedSurveySpy.calledOnce).toBeTruthy();
              done();
            },
          });
        });
      });

      describe("WHEN: Global state for lapsed user survey is set", () => {
        test("THEN: showLapsedUserSurvey is not called", (done) => {
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook: async () => {},
            onInit: async () => {
              sinon
                .stub(StateService.instance(), "getGlobalState")
                .resolves("submitted");
              const lapsedSurveySpy = sinon.spy(
                SurveyUtils,
                "showLapsedUserSurvey"
              );
              sinon
                .stub(vscode.window, "showInformationMessage")
                .resolves({ title: "foo" });
              await showLapsedUserMessage(VSCodeUtils.getAssetUri(ctx));
              await new Promise((resolve: any) => {
                setTimeout(() => {
                  resolve();
                }, 1);
              });
              expect(lapsedSurveySpy.calledOnce).toBeFalsy();
              done();
            },
          });
        });
      });
    });
  });
});
