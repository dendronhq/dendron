import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import path from "path";
import { DendronError } from "./error";

export enum VSCodeEvents {
  ServerCrashed = "ServerCrashed",
  InitializeWorkspace = "InitializeWorkspace",
  Install = "Install",
  SchemaLookup_Show = "SchemaLookup_Show",
  NoteLookup_Gather = "NoteLookup_Gather",
  SchemaLookup_Gather = "SchemaLookup_Gather",
  NoteLookup_Update = "NoteLookup_Update",
  SchemaLookup_Update = "SchemaLookup_Update",
  NoteLookup_Accept = "NoteLookup_Accept",
  SchemaLookup_Accept = "SchemaLookup_Accept",
  TreeView_Ready = "TreeView_Ready",
  Upgrade = "Upgrade",
  DisableTelemetry = "DisableTelemetry",
  EnableTelemetry = "EnableTelemetry",
  Uninstall = "Uninstall",
  ShowLapsedUserMessage = "Show_Lapsed_User_Msg",
  LapsedUserMessageAccepted = "Lapsed_User_Msg_Accepted",
  LapsedUserMessageRejected = "Show_Lapsed_User_Rejected",
  UserOnOldVSCodeVerUnblocked = "User_On_Old_VSCode_Ver_Unblocked"
}

export enum CLIEvents {
  CLITelemetryEnabled = "CLI_Telemetry_Enabled",
  CLITelemetryDisabled = "CLI_Telemetry_Disabled",
}

export enum TutorialEvents {
  WelcomeShow = "WelcomeShow",
  Tutorial_0_Show = "Tutorial_0_Show",
  Tutorial_1_Show = "Tutorial_1_Show",
  Tutorial_2_Show = "Tutorial_2_Show",
  Tutorial_3_Show = "Tutorial_3_Show",
  Tutorial_4_Show = "Tutorial_4_Show",
  Tutorial_5_Show = "Tutorial_5_Show",
}

export enum ExtensionEvents {
  VimExtensionInstalled = "Vim_Extension_Installed",
}

export enum SurveyEvents {
  InitialSurveyPrompted = "Initial_Survey_Prompted",
  InitialSurveyAccepted = "Initial_Survey_Accepted",
  InitialSurveyRejected = "Initial_Survey_Rejected",
  BackgroundAnswered = "Background_Answered",
  BackgroundRejected = "Background_Rejected",
  UseCaseAnswered = "Use_Case_Answered",
  UseCaseRejected = "Use_Case_Rejected",
  PriorToolsAnswered = "Prior_Tools_Answered",
  PriorToolsRejected = "Prior_Tools_Rejected",
  LapsedUserSurveyPrompted = "Lapsed_User_Survey_Prompted",
  LapsedUserSurveyAccepted = "Lapsed_User_Survey_Accepted",
  LapsedUserSurveyRejected = "Lapsed_User_Survey_Rejected",
  LapsedUserReasonAnswered = "Lapsed_User_Reason_Answered",
  LapsedUserReasonRejected = "Lapsed_User_Reason_Rejected",
  LapsedUserGettingStartedHelpAnswered = "Lapsed_User_Getting_Started_Help_Answered",
  LapsedUserGettingStartedHelpRejected = "Lapsed_User_Getting_Started_Help_Rejected",
  LapsedUserAdditionalCommentAnswered = "Lapsed_User_Additional_Comment_Answered",
  LapsedUserAdditionalCommentRejected = "Lapsed_User_Additional_Comment_Rejected",
  LapsedUserDiscordPlugAnswered = "Lapsed_User_Discord_Plug_Answered",
  LapsedUserDiscordPlugRejected = "Lapsed_User_Discord_Plug_Rejected",
}

export enum ConfigEvents {
  ConfigNotMigrated = "Config_Not_Migrated",
}

export enum MigrationEvents {
  MigrationSucceeded = "Migration_Succeeded",
  MigrationFailed = "Migration_Failed",
}

export const DendronEvents = {
  VSCodeEvents,
  CLIEvents,
  TutorialEvents,
  ExtensionEvents,
  SurveyEvents,
  ConfigEvents,
};


export function initializeSentry(environment: string): void {
  const dsn = "https://bc206b31a30a4595a2efb31e8cc0c04e@o949501.ingest.sentry.io/5898219";

  Sentry.init({
    dsn,
    defaultIntegrations: false,
    tracesSampleRate: 1.0,
    enabled: true,
    environment,
    attachStacktrace: true,
    beforeSend: eventModifier,
    integrations: [
      new RewriteFrames({
        prefix: "app:///dist/",
        iteratee: (frame) => {
          if (frame.abs_path) {
            // Convert backslash to forward slash; Sentry should be able to handle the rest of the formatting:
            frame.abs_path =  frame.abs_path.split(path.sep).join(path.posix.sep); 
          }
          return frame;
        },
      }),
    ],
  });
  return;
}

function eventModifier(event: Sentry.Event, hint: Sentry.EventHint | undefined): Sentry.Event | PromiseLike<Sentry.Event | null> | null {
  const error = hint?.originalException;

  // Add more information to the event extras payload:
  if (error && error instanceof DendronError) {
    event.extra = {
      name: error.name,
      message: error.message,
      payload: error.payload,
      severity: error.severity?.toString(),
      code: error.code,
      status: error.status,
      innerError: error,
    };
  }

  return event;
}