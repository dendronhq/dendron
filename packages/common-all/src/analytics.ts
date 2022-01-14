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
  UserOnOldVSCodeVerUnblocked = "User_On_Old_VSCode_Ver_Unblocked",
  ShowInactiveUserMessage = "Show_Inactive_User_Message",
}

export enum CLIEvents {
  CLITelemetryEnabled = "CLI_Telemetry_Enabled",
  CLITelemetryDisabled = "CLI_Telemetry_Disabled",
  CLIMigrationSucceeded = "CLI_Migration_Succeeded",
  CLIMigrationFailed = "CLI_Migration_Failed",
  CLIClientConfigMismatch = "CLI_Client_Config_Mismatch",
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
  ConflictingExtensionsWarned = "Conflicting_Extensions_Warned",
  ConflictingExtensionsPreviewDisplayed = "Conflicting_Extensions_Preview_Displayed",
}

export enum LookupEvents {
  LookupModifierToggledByUser = "Lookup_Modifier_Toggled_By_User",
  LookupModifiersSetOnAccept = "Lookup_Modifiers_Set_On_Accept",
}

export enum SurveyEvents {
  InitialSurveyPrompted = "Initial_Survey_Prompted",
  InitialSurveyAccepted = "Initial_Survey_Accepted",
  InitialSurveyRejected = "Initial_Survey_Rejected",
  BackgroundAnswered = "Background_Answered",
  BackgroundRejected = "Background_Rejected",
  UseCaseAnswered = "Use_Case_Answered",
  UseCaseRejected = "Use_Case_Rejected",
  PublishingUseCaseAnswered = "Publishing_Use_Case_Answered",
  PublishingUseCaseRejected = "Publishing_Use_Case_Rejected",
  PriorToolsAnswered = "Prior_Tools_Answered",
  PriorToolsRejected = "Prior_Tools_Rejected",
  NewsletterSubscriptionAnswered = "Newsletter_Subscription_Answered",
  NewsletterSubscriptionRejected = "Newsletter_Subscription_Rejected",
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
  InactiveUserSurveyPrompted = "Inactive_User_Survey_Prompted",
  InactiveUserSurveyAccepted = "Inactive_User_Survey_Accepted",
  InactiveUserSurveyRejected = "Inactive_User_Survey_Rejected",
}

export enum ConfigEvents {
  ConfigNotMigrated = "Config_Not_Migrated",
  EnabledExportPodV2 = "Enabled_Export_Pod_V2",
}

export enum MigrationEvents {
  MigrationSucceeded = "Migration_Succeeded",
  MigrationFailed = "Migration_Failed",
}

export enum ContextualUIEvents {
  ContextualUIRename = "ContextualUI_Rename",
  ContextualUICreateNewFile = "ContextualUI_CreateNewFile",
  ContextualUIDelete = "ContextualUI_Delete",
  ContextualUICodeAction = "ContextualUI_CodeAction",
}

export enum NativeWorkspaceEvents {
  DetectedInNonDendronWS = "Native_Workspace_Detected_In_Non_Dendron_WS", // watcher has detected a Dendron workspace getting created inside a non-Dendron workspace
}

export const DendronEvents = {
  VSCodeEvents,
  CLIEvents,
  TutorialEvents,
  ExtensionEvents,
  SurveyEvents,
  ConfigEvents,
  ContextualUIEvents,
  NativeWorkspaceEvents,
};
