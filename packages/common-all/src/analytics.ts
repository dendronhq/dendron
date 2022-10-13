// For all new additions to the telemetry events, follow UpperCamelCasing and
// use noun+verb for the event name.

/* eslint-disable camelcase */
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
  Upgrade = "Upgrade",
  UpgradeSeeWhatsChangedClicked = "UpgradeSeeWhatsChangedClicked",
  UpgradeViewClosed = "UpgradeViewClosed",
  DisableTelemetry = "DisableTelemetry",
  EnableTelemetry = "EnableTelemetry",
  Uninstall = "Uninstall",
  ShowLapsedUserMessage = "Show_Lapsed_User_Msg",
  LapsedUserMessageAccepted = "Lapsed_User_Msg_Accepted",
  LapsedUserMessageRejected = "Show_Lapsed_User_Rejected",
  UserOnOldVSCodeVerUnblocked = "User_On_Old_VSCode_Ver_Unblocked",
  ShowInactiveUserMessage = "Show_Inactive_User_Message",
  FeatureShowcaseDisplayed = "FeatureShowcasedDisplayed",
  FeatureShowcaseResponded = "FeatureShowcaseResponded",
  HelpAndFeedbackItemClicked = "HelpAndFeedbackItemClicked",
  BacklinksPanelUsed = "BacklinksPanelUsed",
  RecentWorkspacesPanelUsed = "RecentWorkspacesPanelUsed",
  V100ReleaseNotesShown = "V100ReleaseNotesShown",
  NoteTraitsInitialized = "NoteTraitsInitialized",
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
  ClickStart = "Getting_Started_Clicked",
  TutorialNoteViewed = "TutorialNoteViewed",
  TutorialPreviewLinkClicked = "TutorialPreviewLinkClicked",
  TutorialWorkspaceLaunching = "TutorialWorkspaceLaunching",
}

export type TutorialPreviewLinkClickedPayload = {
  linkType: "WIKI" | "ASSET" | "WEBSITE" | "TEXT" | "COMMAND" | "UNKNOWN";
  href: string;
};

export type TutorialNoteViewedPayload = {
  tutorialType: string;
  fname: string;
  currentStep: number;
  totalSteps: number;
};

export enum KeybindingConflictDetectedSource {
  activation = "activation",
  doctor = "doctor",
}

export enum ConfirmStatus {
  accepted = "accepted",
  rejected = "rejected",
}

export type RefactoringCommandUsedPayload = {
  command: string;
  numVaults: number;
  traits: string[];
  numChildren: number;
  numLinks: number;
  numChars: number;
  noteDepth: number;
};

export enum ExtensionEvents {
  VimExtensionInstalled = "Vim_Extension_Installed",
  IncompatibleExtensionsWarned = "Incompatible_Extensions_Warned",
  IncompatibleExtensionsPreviewDisplayed = "Incompatible_Extensions_Preview_Displayed",
  KeybindingConflictDetected = "Keybinding_Conflict_Detected",
  ShowKeybindingConflictAccepted = "Show_Keybinding_Conflict_Accepted",
  ShowKeybindingConflictRejected = "Show_Keybinding_Conflict_Rejected",
  DeprecationNoticeShow = "DeprecationNoticeShow",
  DeprecationNoticeAccept = "DeprecationNoticeAccept",
  LocalhostBlockedNotified = "LocalhostBlocked_Notified",
  LocalhostBlockedAccepted = "LocalhostBlocked_Accepted",
  LocalhostBlockedRejected = "LocalhostBlocked_Rejected",
}

export enum LookupEvents {
  LookupModifierToggledByUser = "Lookup_Modifier_Toggled_By_User",
  LookupModifiersSetOnAccept = "Lookup_Modifiers_Set_On_Accept",
}

export enum SurveyEvents {
  InitialSurveyPrompted = "Initial_Survey_Prompted",
  InitialSurveyAccepted = "Initial_Survey_Accepted",
  InitialSurveyRejected = "Initial_Survey_Rejected",
  ContextSurveyConfirm = "contextSurveyConfirm",
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
  InactiveUserSurveyPromptReason = "Inactive_User_Prompt_Reason",
}

export enum GitEvents {
  ContributorsFound = "ContributorsFound",
  TopLevelRepoFound = "TopLevelRepoFound",
}

export enum ConfigEvents {
  ConfigNotMigrated = "Config_Not_Migrated",
  EnabledExportPodV2 = "Enabled_Export_Pod_V2",
  ShowMissingDefaultConfigMessage = "Show_Missing_Default_Config_Message",
  DeprecatedConfigMessageConfirm = "DeprecatedConfigMessageConfirm",
  DeprecatedConfigMessageShow = "ShowDeprecatedConfigMessage",
  MissingDefaultConfigMessageConfirm = "MissingDefaultConfigMessageConfirm",
  DuplicateConfigEntryMessageShow = "DuplicateConfigEntryMessageShow",
  DuplicateConfigEntryMessageConfirm = "DuplicateConfigEntryMessageConfirm",
  MissingSelfContainedVaultsMessageShow = "MissingSelfContainedVaultsMessageShow",
  MissingSelfContainedVaultsMessageAccept = "MissingSelfContainedVaultsMessageAccept",
  OutdatedSeedVaultMessageShow = "OutdatedSeedVaultMessageShow",
  OutdatedSeedVaultMessageAccept = "OutdatedSeedVaultMessageAccept",
  ConfigChangeDetected = "ConfigChangeDetected",
}

export enum MigrationEvents {
  MigrationSucceeded = "Migration_Succeeded",
  MigrationFailed = "Migration_Failed",
  ManualUpgradeMessageShow = "ManualUpgradeMessageShow",
  ManualUpgradeMessageConfirm = "ManualUpgradeMessageConfirm",
}

export enum ContextualUIEvents {
  ContextualUIRename = "ContextualUI_Rename",
  ContextualUICreateNewFile = "ContextualUI_CreateNewFile",
  ContextualUIDelete = "ContextualUI_Delete",
  ContextualUICodeAction = "ContextualUI_CodeAction",
}

export enum WorkspaceEvents {
  AutoFix = "AutoFix",
  DuplicateNoteFound = "DuplicateNoteFound",
  TransitiveDepsWarningShow = "TransitiveDepsWarningShow",
  MultipleTelemetryIdsDetected = "MultipleTelemetryIdsDetected",
}

export enum NativeWorkspaceEvents {
  DetectedInNonDendronWS = "Native_Workspace_Detected_In_Non_Dendron_WS", // watcher has detected a Dendron workspace getting created inside a non-Dendron workspace
}

export enum EngagementEvents {
  NoteViewed = "NoteViewed",
  NoteScrolled = "NoteScrolled",
  EngineStateChanged = "EngineStateChanged",
  AdditionalNoteFromMeetingNoteCreated = "AdditionalNoteFromMeetingNoteCreated",
  TemplateApplied = "TemplateApplied",
  RefactoringCommandUsed = "RefactoringCommandUsed",
}

export enum NoteScrolledSource {
  EDITOR = "EDITOR",
  PREVIEW = "PREVIEW",
}

export enum AppNames {
  CODE = "vscode",
  CLI = "cli",
  EXPRESS_SERVER = "express",
  CODE_WEB = "vscode-web",
}

export enum GraphEvents {
  GraphThemeChanged = "GraphThemeChanged",
  GraphViewUsed = "GraphViewUsed",
  GraphPanelUsed = "GraphPanelUsed",
}

export enum TreeViewEvents {
  NoteOmittedErrorMessageShow = "NoteOmittedErrorMessageShow",
  NoteOmittedErrorMessageConfirm = "NoteOmittedErrorMessageConfirm",
}

export const DendronEvents = {
  VSCodeEvents,
  CLIEvents,
  GitEvents,
  TutorialEvents,
  ExtensionEvents,
  SurveyEvents,
  ConfigEvents,
  ContextualUIEvents,
  NativeWorkspaceEvents,
  WorkspaceEvents,
  EngagementEvents,
  GraphEvents,
  TreeViewEvents,
};

/**
 * User Profile.
 */
type UserProfileProps = {
  /**
   * The number of notes in the workspace
   */
  numNotes?: number;
  /**
   * The current A/B test groups the user is participating in
   */
  splitTests?: string[];
  /**
   * The role of user. Retrieved from initial survey.
   */
  role?: string;
  /**
   * The use case of Dendron for the user. Retrieved from initial survey.
   */
  useCases?: string[];
  /**
   * The context Dendron is used for the user. Retrieved from initial survey.
   */
  useContext?: string;
  /**
   * Whether the user has intent for publishing. If so, how. Retrieved from initial survey.
   */
  publishingUseCase?: string;
  /**
   * Prior tools the user has used before Dendron. Retrieved from initial survey.
   */
  priorTools?: string[];
  /**
   * Email of user. Retrieved from initial survey.
   */
  email?: string;

  /**
   * Did the user express interest in using Dendron for a team?
   */
  teamIntent?: boolean;
};

// platform props
export type VSCodeProps = {
  type: AppNames.CODE;
  ideVersion: string;
  ideFlavor: string;
} & UserProfileProps;

// platform identify props
export type VSCodeIdentifyProps = {
  appVersion: string;
  appHost: string;
  userAgent: string;
  isNewAppInstall: boolean;
  isTelemetryEnabled: boolean;
  language: string;
  machineId: string;
  shell: string;
} & VSCodeProps;

export type CLIProps = {
  type: AppNames.CLI;
  cliVersion: string;
} & UserProfileProps;

export type CLIIdentifyProps = CLIProps;
