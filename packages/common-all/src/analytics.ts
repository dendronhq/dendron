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

export const DendronEvents = {
  VSCodeEvents,
  TutorialEvents,
  ExtensionEvents,
};
