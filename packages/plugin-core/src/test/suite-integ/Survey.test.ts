import {
  InitialSurveyStatusEnum,
  LapsedUserSurveyStatusEnum,
  MetadataService,
} from "@dendronhq/engine-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import { after, afterEach, beforeEach, describe } from "mocha";
import sinon, { SinonSpy, SinonStub } from "sinon";
import * as vscode from "vscode";
import { GLOBAL_STATE } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { StateService } from "../../services/stateService";
import { SurveyUtils } from "../../survey";
import { StartupPrompts } from "../../utils/StartupPrompts";
import { VSCodeUtils } from "../../vsCodeUtils";
import { TutorialInitializer } from "../../workspace/tutorialInitializer";
import { expect, resetCodeWorkspace } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

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
    let homeDirStub: SinonStub;
    let stateStub: SinonStub;
    let surveySpy: SinonSpy;
    let infoMsgStub: SinonStub;

    describeMultiWS(
      "GIVEN LAPSED_USER_SURVEY_SUBMITTED is not set",
      {
        beforeHook: async () => {
          await resetCodeWorkspace();
          homeDirStub = TestEngineUtils.mockHomeDir();
        },
      },
      (ctx) => {
        after(() => {
          homeDirStub.restore();
        });

        beforeEach(() => {
          stateStub = sinon
            .stub(StateService.instance(), "getGlobalState")
            .resolves(undefined);
          surveySpy = sinon.spy(SurveyUtils, "showLapsedUserSurvey");
          infoMsgStub = sinon
            .stub(vscode.window, "showInformationMessage")
            .resolves({ title: "foo" });
        });

        afterEach(() => {
          stateStub.restore();
          surveySpy.restore();
          infoMsgStub.restore();
        });

        describe("AND lapsedUserSurveyStatus is not set", () => {
          test("THEN showLapsedUserSurvey is called", async () => {
            await StartupPrompts.showLapsedUserMessage(
              VSCodeUtils.getAssetUri(ctx)
            );
            await new Promise((resolve: any) => {
              setTimeout(() => {
                resolve();
              }, 1);
            });
            expect(surveySpy.calledOnce).toBeTruthy();
          });
        });

        describe("AND lapsedUserSurveyStatus is set to submitted", () => {
          test("THEN showLapsedUserSurvey is not called", async () => {
            MetadataService.instance().setLapsedUserSurveyStatus(
              LapsedUserSurveyStatusEnum.submitted
            );
            await StartupPrompts.showLapsedUserMessage(
              VSCodeUtils.getAssetUri(ctx)
            );
            await new Promise((resolve: any) => {
              setTimeout(() => {
                resolve();
              }, 1);
            });
            expect(surveySpy.calledOnce).toBeFalsy();
          });
        });
      }
    );

    describeMultiWS(
      "GIVEN LAPSED_USER_SURVEY_SUBMITTED is set",
      {
        beforeHook: async () => {
          await resetCodeWorkspace();
          homeDirStub = TestEngineUtils.mockHomeDir();
        },
      },
      (ctx) => {
        after(() => {
          homeDirStub.restore();
        });

        beforeEach(() => {
          stateStub = sinon
            .stub(StateService.instance(), "getGlobalState")
            .resolves("submitted");
          surveySpy = sinon.spy(SurveyUtils, "showLapsedUserSurvey");
          infoMsgStub = sinon
            .stub(vscode.window, "showInformationMessage")
            .resolves({ title: "foo" });
        });

        afterEach(() => {
          stateStub.restore();
          surveySpy.restore();
          infoMsgStub.restore();
        });

        describe("AND lapsedUserSurveyStatus is not set", () => {
          test("THEN metadata is backfilled AND showLapsedUserSurvye is not called", async () => {
            // metadata is not set yet, we expect this to be backfilled.
            expect(
              MetadataService.instance().getLapsedUserSurveyStatus()
            ).toEqual(undefined);
            // global state is already set.
            expect(
              await StateService.instance().getGlobalState(
                GLOBAL_STATE.LAPSED_USER_SURVEY_SUBMITTED
              )
            ).toEqual("submitted");

            await StartupPrompts.showLapsedUserMessage(
              VSCodeUtils.getAssetUri(ctx)
            );
            await new Promise((resolve: any) => {
              setTimeout(() => {
                resolve();
              }, 1);
            });

            expect(surveySpy.calledOnce).toBeFalsy();

            // metadata is backfilled.
            expect(
              MetadataService.instance().getLapsedUserSurveyStatus()
            ).toEqual(LapsedUserSurveyStatusEnum.submitted);
          });
        });

        describe("AND lapsedUserSurveyStatus is set to submitted", () => {
          test("THEN showLapsedUserSurvey is not called", async () => {
            expect(
              MetadataService.instance().getLapsedUserSurveyStatus()
            ).toEqual(LapsedUserSurveyStatusEnum.submitted);
            expect(
              await StateService.instance().getGlobalState(
                GLOBAL_STATE.LAPSED_USER_SURVEY_SUBMITTED
              )
            ).toEqual("submitted");

            await StartupPrompts.showLapsedUserMessage(
              VSCodeUtils.getAssetUri(ctx)
            );
            await new Promise((resolve: any) => {
              setTimeout(() => {
                resolve();
              }, 1);
            });

            expect(surveySpy.calledOnce).toBeFalsy();
          });
        });
      }
    );
  });
});
