
export enum ConfigAreas {
  GENERAL = "General",
  ADVANCED = "Advanced",
  PUBLISHING = "Publishing",
  WORKSPACE = "Workspace",
}
export const buckets: ConfigAreas[] = [
  ConfigAreas.GENERAL,
  ConfigAreas.WORKSPACE,
  ConfigAreas.PUBLISHING,
  ConfigAreas.ADVANCED,
];

const bucketConfig: { [key in ConfigAreas]: string[] } = {
  [ConfigAreas.GENERAL]: ["mermaid", "useKatex", "defaultInsertHierarchy"],
  [ConfigAreas.WORKSPACE]: [
    // "workspaces",
    // "seeds",
    "vaults",
    "hooks",
    // "workspaceVaultSync",
  ],
  [ConfigAreas.PUBLISHING]: ["site"],
  [ConfigAreas.ADVANCED]: [
    "lookupConfirmVaultOnCreate",
    "noAutoCreateOnDefinition",
    "noXVaultWikiLink",
    "useFMTitle",
    "useNoteTitleForLink",
    "noTelemetry",
    "dev",
  ],
};



export default bucketConfig;
