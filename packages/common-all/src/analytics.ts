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
}

export const DendronEvents = {
  VSCodeEvents,
};
