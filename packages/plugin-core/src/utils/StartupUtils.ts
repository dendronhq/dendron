import {
  ConfigEvents,
  ConfigUtils,
  ConfirmStatus,
  ExtensionEvents,
  InstallStatus,
  SurveyEvents,
  Time,
  VSCodeEvents,
} from "@dendronhq/common-all";
import {
  DConfig,
  DoctorActionsEnum,
  InactvieUserMsgStatusEnum,
  MetadataService,
} from "@dendronhq/engine-server";
import { IDendronExtension } from "../dendronExtensionInterface";
import { AnalyticsUtils } from "./analytics";
import * as vscode from "vscode";
import { DoctorCommand, PluginDoctorActionsEnum } from "../commands/Doctor";
import { Duration } from "luxon";
import { showWelcome } from "../WelcomeUtils";
import { StateService } from "../services/stateService";
import { GLOBAL_STATE, INCOMPATIBLE_EXTENSIONS } from "../constants";
import { SurveyUtils } from "../survey";
import { VSCodeUtils } from "../vsCodeUtils";

export class StartupUtils {
  static showMissingDefaultConfigMessageIfNecessary(opts: {
    ext: IDendronExtension;
    extensionInstallStatus: InstallStatus;
  }) {
    if (StartupUtils.shouldDisplayMissingDefaultConfigMessage(opts)) {
      StartupUtils.showMissingDefaultConfigMessage({ ext: opts.ext });
    }
  }

  static shouldDisplayMissingDefaultConfigMessage(opts: {
    ext: IDendronExtension;
    extensionInstallStatus: InstallStatus;
  }): boolean {
    if (opts.extensionInstallStatus === InstallStatus.UPGRADED) {
      const wsRoot = opts.ext.getDWorkspace().wsRoot;
      const rawConfig = DConfig.getRaw(wsRoot);
      const out = ConfigUtils.detectMissingDefaults({ config: rawConfig });
      return out !== undefined && out.needsBackfill;
    } else {
      return false;
    }
  }

  static showMissingDefaultConfigMessage(opts: { ext: IDendronExtension }) {
    AnalyticsUtils.track(ConfigEvents.ShowMissingDefaultConfigMessage);
    const ADD_CONFIG = "Add Missing Configuration";
    const MESSAGE =
      "We have detected a missing configuration. This may happen because a new configuration was introduced, or because an existing required configuration has been deleted. Would you like to add them to dendron.yml?";
    vscode.window
      .showInformationMessage(MESSAGE, ADD_CONFIG)
      .then(async (resp) => {
        if (resp === ADD_CONFIG) {
          AnalyticsUtils.track(
            ConfigEvents.MissingDefaultConfigMessageConfirm,
            {
              status: ConfirmStatus.accepted,
            }
          );
          const cmd = new DoctorCommand(opts.ext);
          await cmd.execute({
            action: DoctorActionsEnum.ADD_MISSING_DEFAULT_CONFIGS,
            scope: "workspace",
          });
        } else {
          AnalyticsUtils.track(
            ConfigEvents.MissingDefaultConfigMessageConfirm,
            {
              status: ConfirmStatus.rejected,
            }
          );
        }
      });
  }

  static async showLapsedUserMessageIfNecessary(opts: {
    assetUri: vscode.Uri;
  }) {
    if (StartupUtils.shouldDisplayLapsedUserMsg()) {
      await StartupUtils.showLapsedUserMessage(opts.assetUri);
    }
  }

  static shouldDisplayLapsedUserMsg(): boolean {
    const ONE_DAY = Duration.fromObject({ days: 1 });
    const ONE_WEEK = Duration.fromObject({ weeks: 1 });
    const CUR_TIME = Duration.fromObject({ seconds: Time.now().toSeconds() });
    const metaData = MetadataService.instance().getMeta();

    // If we haven't prompted the user yet and it's been a day since their
    // initial install OR if it's been one week since we last prompted the user
    const refreshMsg =
      (metaData.lapsedUserMsgSendTime === undefined &&
        ONE_DAY <=
          CUR_TIME.minus(
            Duration.fromObject({ seconds: metaData.firstInstall })
          )) ||
      (metaData.lapsedUserMsgSendTime !== undefined &&
        ONE_WEEK <=
          CUR_TIME.minus(
            Duration.fromObject({ seconds: metaData.lapsedUserMsgSendTime })
          ));

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
          const lapsedSurveySubmitted =
            await StateService.instance().getGlobalState(
              GLOBAL_STATE.LAPSED_USER_SURVEY_SUBMITTED
            );
          if (lapsedSurveySubmitted === undefined) {
            await SurveyUtils.showLapsedUserSurvey();
          }
          return;
        }
      });
  }

  static async showInactiveUserMessageIfNecessary() {
    if (StartupUtils.shouldDisplayInactiveUserSurvey()) {
      await StartupUtils.showInactiveUserMessage();
    }
  }

  static shouldDisplayInactiveUserSurvey(): boolean {
    const metaData = MetadataService.instance().getMeta();

    const inactiveSurveyMsgStatus = metaData.inactiveUserMsgStatus;
    if (inactiveSurveyMsgStatus === InactvieUserMsgStatusEnum.submitted) {
      return false;
    }

    // rare case where global state has been reset (or a reinstall) may cause issues with
    // the prompt logic. ignore these cases and don't show the
    if (
      metaData.firstInstall !== undefined &&
      metaData.firstLookupTime !== undefined
    ) {
      if (metaData.firstLookupTime - metaData.firstInstall < 0) {
        return false;
      }
    }

    const ONE_WEEK = Duration.fromObject({ weeks: 1 });
    const FOUR_WEEKS = Duration.fromObject({ weeks: 4 });
    const currentTime = Time.now().toSeconds();
    const CUR_TIME = Duration.fromObject({ seconds: currentTime });

    const FIRST_INSTALL =
      metaData.firstInstall !== undefined
        ? Duration.fromObject({ seconds: metaData.firstInstall })
        : undefined;

    const FIRST_LOOKUP_TIME =
      metaData.firstLookupTime !== undefined
        ? Duration.fromObject({ seconds: metaData.firstLookupTime })
        : undefined;

    const LAST_LOOKUP_TIME =
      metaData.lastLookupTime !== undefined
        ? Duration.fromObject({ seconds: metaData.lastLookupTime })
        : undefined;

    const INACTIVE_USER_MSG_SEND_TIME =
      metaData.inactiveUserMsgSendTime !== undefined
        ? Duration.fromObject({ seconds: metaData.inactiveUserMsgSendTime })
        : undefined;

    // is the user a first week active user?
    const isFirstWeekActive =
      FIRST_INSTALL !== undefined &&
      FIRST_LOOKUP_TIME !== undefined &&
      FIRST_LOOKUP_TIME.minus(FIRST_INSTALL) <= ONE_WEEK;

    // was the user active on the first week but has been inactive for more than four weeks?
    const isInactive =
      isFirstWeekActive &&
      LAST_LOOKUP_TIME !== undefined &&
      CUR_TIME.minus(LAST_LOOKUP_TIME) >= FOUR_WEEKS;

    // if they have cancelled last time, we should be waiting another four weeks.
    if (inactiveSurveyMsgStatus === InactvieUserMsgStatusEnum.cancelled) {
      const shouldSendAgain =
        INACTIVE_USER_MSG_SEND_TIME !== undefined &&
        CUR_TIME.minus(INACTIVE_USER_MSG_SEND_TIME) >= FOUR_WEEKS &&
        isInactive;
      if (shouldSendAgain) {
        AnalyticsUtils.track(SurveyEvents.InactiveUserSurveyPromptReason, {
          reason: "reprompt",
          currentTime,
          ...metaData,
        });
      }
      return shouldSendAgain;
    } else {
      // this is the first time we are asking them.
      const shouldSend =
        metaData.dendronWorkspaceActivated !== undefined &&
        metaData.firstWsInitialize !== undefined &&
        isInactive &&
        // this is needed since we may have prompted them before we introduced this metadata
        metaData.inactiveUserMsgSendTime === undefined;
      if (shouldSend) {
        AnalyticsUtils.track(SurveyEvents.InactiveUserSurveyPromptReason, {
          reason: "initial_prompt",
          currentTime,
          ...metaData,
        });
      }
      return shouldSend;
    }
  }

  static async showInactiveUserMessage() {
    AnalyticsUtils.track(VSCodeEvents.ShowInactiveUserMessage);
    MetadataService.instance().setInactiveUserMsgSendTime();
    await SurveyUtils.showInactiveUserSurvey();
  }

  static warnIncompatibleExtensions(opts: { ext: IDendronExtension }) {
    const installStatus = INCOMPATIBLE_EXTENSIONS.map((extId) => {
      return { id: extId, installed: VSCodeUtils.isExtensionInstalled(extId) };
    });

    const installedExtensions = installStatus
      .filter((status) => status.installed)
      .map((status) => status.id);

    const shouldDisplayWarning = installStatus.some(
      (status) => status.installed
    );
    if (shouldDisplayWarning) {
      AnalyticsUtils.track(ExtensionEvents.IncompatibleExtensionsWarned, {
        installedExtensions,
      });
      vscode.window
        .showWarningMessage(
          "We have detected some extensions that may conflict with Dendron. Further action is needed for Dendron to function correctly",
          "Fix conflicts..."
        )
        .then(async (resp) => {
          if (resp === "Fix conflicts...") {
            const cmd = new DoctorCommand(opts.ext);
            await cmd.execute({
              action: PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS,
              scope: "workspace",
              data: { installStatus },
            });
          }
        });
    }
  }
}
