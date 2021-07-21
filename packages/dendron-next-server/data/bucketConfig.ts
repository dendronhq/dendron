export const buckets: string[] = [
  "Workspace",
  "Features",
  "Advanced",
  "Publishing",
];

const bucketConfig: { [key: string]: string[] } = {
  Workspace: [
    "workspaces",
    "seeds",
    "workspaceVaultSync",
    "hooks",
    "initializeRemoteVaults",
  ],
  Features: ["journal", "mermaid", "randomNote", "usePrettyRefs", "useKatex"],
  Advanced: [
    "lookupConfirmVaultOnCreate",
    "noAutoCreateOnDefinition",
    "noXVaultWikiLink",
    "useFMTitle",
    "useNoteTitleForLink",
    "defaultInsertHierarchy",
    "dev",
    "noTelemetry",
    "noCaching",
  ],
  Publishing: ["hierarchyDisplay", "hierarchyDisplayTitle", "site"],
};

export default bucketConfig;
