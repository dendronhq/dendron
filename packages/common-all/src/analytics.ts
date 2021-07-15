export enum VSCodeEvents {
  InitializeWorkspace = "InitializeWorkspace",
  Install = "Install",
  Lookup_Show = "Lookup_Show",
  Lookup_Update = "Lookup_Update",
  Lookup_Accept = "Lookup_Accept",
  TreeView_Ready = "TreeView_Ready",
  Upgrade = "Upgrade",
  DisableTelemetry = "DisableTelemetry",
  EnableTelemetry = "EnableTelemetry",
  Uninstall = "Uninstall",
  ShowLapsedUserMessage = "Show_Lapsed_User_Msg",
  LapsedUserMessageAccepted = "Lapsed_User_Msg_Accepted",
  LapsedUserMessageRejected = "Show_Lapsed_User_Rejected"
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

export const DendronEvents = {
  VSCodeEvents,
  TutorialEvents
};
