import { Time, VSCodeEvents } from "@dendronhq/common-all";
import {
  LapsedUserSurveyStatusEnum,
  MetadataService,
} from "@dendronhq/engine-server";
import { Duration } from "luxon";
import * as vscode from "vscode";
import { GLOBAL_STATE } from "../constants";
import { StateService } from "../services/stateService";
import { SurveyUtils } from "../survey";
import { showWelcome } from "../WelcomeUtils";
import { AnalyticsUtils } from "./analytics";

export class StartupPrompts {
  static async showLapsedUserMessageIfNecessary(opts: {
    assetUri: vscode.Uri;
  }) {
    if (StartupPrompts.shouldDisplayLapsedUserMsg()) {
      await StartupPrompts.showLapsedUserMessage(opts.assetUri);
    }
  }

  static shouldDisplayLapsedUserMsg(): boolean {
    const ONE_DAY = Duration.fromObject({ days: 1 });
    const ONE_WEEK = Duration.fromObject({ weeks: 1 });
    const CUR_TIME = Duration.fromObject({ seconds: Time.now().toSeconds() });
    const metaData = MetadataService.instance().getMeta();

    // If we haven't prompted the user yet and it's been a day since their
    // initial install OR if it's been one week since we last prompted the user

    const lapsedUserMsgSendTime = metaData.lapsedUserMsgSendTime;
    if (lapsedUserMsgSendTime !== undefined) {
      MetadataService.instance().setLapsedUserSurveyStatus(
        LapsedUserSurveyStatusEnum.cancelled
      );
    }

    const timeFromFirstInstall = CUR_TIME.minus(
      Duration.fromObject({ seconds: metaData.firstInstall })
    );
    const timeFromLastLapsedUserMsg = CUR_TIME.minus(
      Duration.fromObject({ seconds: metaData.lapsedUserMsgSendTime })
    );

    const refreshMsg =
      (metaData.lapsedUserMsgSendTime === undefined &&
        ONE_DAY <= timeFromFirstInstall) ||
      (metaData.lapsedUserMsgSendTime !== undefined &&
        ONE_WEEK <= timeFromLastLapsedUserMsg);

    // If the user has never initialized, has never activated a dendron workspace,
    // and it's time to refresh the lapsed user message
    return (
      !metaData.dendronWorkspaceActivated &&
      !metaData.firstWsInitialize &&
      refreshMsg
    );
  }

  static async showLapsedUserMessage(assetUri: vscode.Uri) {
    const START_TITLE = "Get Started";

    AnalyticsUtils.track(VSCodeEvents.ShowLapsedUserMessage);
    MetadataService.instance().setLapsedUserMsgSendTime();
    vscode.window
      .showInformationMessage(
        "Hey, we noticed you haven't started using Dendron yet. Would you like to get started?",
        { modal: true },
        { title: START_TITLE }
      )
      .then(async (resp) => {
        if (resp?.title === START_TITLE) {
          AnalyticsUtils.track(VSCodeEvents.LapsedUserMessageAccepted);
          showWelcome(assetUri);
        } else {
          AnalyticsUtils.track(VSCodeEvents.LapsedUserMessageRejected);
          const lapsedSurveySubmittedState =
            await StateService.instance().getGlobalState(
              GLOBAL_STATE.LAPSED_USER_SURVEY_SUBMITTED
            );

          if (lapsedSurveySubmittedState) {
            MetadataService.instance().setLapsedUserSurveyStatus(
              LapsedUserSurveyStatusEnum.submitted
            );
          }

          const lapsedUserSurveySubmitted =
            MetadataService.instance().getLapsedUserSurveyStatus();

          if (
            lapsedUserSurveySubmitted !== LapsedUserSurveyStatusEnum.submitted
          ) {
            await SurveyUtils.showLapsedUserSurvey();
          }
          return;
        }
      });
  }
}
