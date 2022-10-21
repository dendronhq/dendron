import { SearchMode } from "@dendronhq/common-all";

export type Config = {
  type: string;
  group: string;
  default?: any;
  enum?: string[];
};

export const dendronConfig: { [key: string]: Config } = {
  "commands.lookup.note.selectionMode": {
    type: "select",
    group: "commands",
    enum: ["extract", "link", "none"],
  },
  "commands.lookup.note.vaultSelectionModeOnCreate": {
    type: "select",
    enum: ["smart", "alwaysPrompt"],
    group: "commands",
  },
  "commands.lookup.note.leaveTrace": {
    type: "boolean",
    group: "commands",
  },
  "commands.lookup.note.bubbleUpCreateNew": {
    type: "boolean",
    group: "commands",
  },
  "commands.randomNote.include": {
    type: "array",
    group: "commands",
  },
  "commands.randomNote.exclude": {
    type: "array",
    group: "commands",
  },
  "commands.insertNoteLink.aliasMode": {
    type: "select",
    enum: ["snippet", "selection", "title", "prompt", "none"],
    group: "commands",
  },
  "commands.insertNoteLink.enableMultiSelect": {
    type: "boolean",
    group: "commands",
  },
  "commands.insertNoteIndex.enableMarker": {
    type: "boolean",
    group: "commands",
  },
  "commands.copyNoteLink.nonNoteFile.anchorType": {
    type: "select",
    enum: ["line", "block", "prompt"],
    group: "commands",
  },
  "commands.templateHierarchy": {
    type: "string",
    group: "commands",
  },
  "workspace.journal.dailyDomain": {
    type: "string",
    group: "workspace",
  },
  "workspace.journal.dailyVault": {
    type: "string",
    group: "workspace",
  },
  "workspace.journal.name": {
    type: "string",
    group: "workspace",
  },
  "workspace.journal.dateFormat": {
    type: "string",
    group: "workspace",
  },
  "workspace.journal.addBehavior": {
    type: "select",
    group: "workspace",
    enum: [
      "childOfDomain",
      "childOfDomainNamespace",
      "childOfCurrent",
      "asOwnDomain",
    ],
  },
  "workspace.scratch.name": {
    type: "string",
    group: "workspace",
  },
  "workspace.scratch.dateFormat": {
    type: "string",
    group: "workspace",
  },
  "workspace.scratch.addBehavior": {
    type: "select",
    group: "workspace",
    enum: [
      "childOfDomain",
      "childOfDomainNamespace",
      "childOfCurrent",
      "asOwnDomain",
    ],
  },
  "workspace.task.name": {
    type: "string",
    group: "workspace",
  },
  "workspace.task.dateFormat": {
    type: "string",
    group: "workspace",
  },
  "workspace.task.addBehavior": {
    type: "select",
    enum: [
      "childOfDomain",
      "childOfDomainNamespace",
      "childOfCurrent",
      "asOwnDomain",
    ],
    group: "workspace",
  },
  "workspace.task.prioritySymbols": {
    type: "list",
    group: "workspace",
  },
  "workspace.task.statusSymbols": {
    type: "list",
    group: "workspace",
  },
  "workspace.task.todoIntegration": {
    type: "boolean",
    group: "workspace",
  },
  "workspace.task.createTaskSelectionType": {
    type: "select",
    group: "workspace",
    enum: ["selection2link", "selectionExtract", "none"],
  },
  "workspace.task.taskCompleteStatus": {
    type: "array",
    group: "workspace",
  },
  "workspace.vaults": {
    type: "object",
    group: "workspace",
  },
  "workspace.hooks": {
    type: "object",
    group: "workspace",
  },
  "workspace.graph.zoomSpeed": {
    type: "number",
    group: "workspace",
  },
  "workspace.graph.createStub": {
    type: "boolean",
    group: "workspace",
  },
  "workspace.enableAutoCreateOnDefinition": {
    type: "boolean",
    group: "workspace",
  },
  "workspace.enableXVaultWikiLink": {
    type: "boolean",
    group: "workspace",
  },
  "workspace.enableRemoteVaultInit": {
    type: "boolean",
    group: "workspace",
  },
  "workspace.enableAutoFoldFrontmatter": {
    type: "boolean",
    group: "workspace",
  },
  "workspace.enableEditorDecorations": {
    type: "boolean",
    group: "workspace",
  },
  "workspace.enableUserTags": {
    type: "boolean",
    group: "workspace",
  },
  "workspace.enableHashTags": {
    type: "boolean",
    group: "workspace",
  },
  "workspace.enableFullHierarchyNoteTitle": {
    type: "boolean",
    group: "workspace",
  },
  "preview.enableFMTitle": {
    type: "boolean",
    group: "preview",
  },
  "preview.enableNoteTitleForLink": {
    type: "boolean",
    group: "preview",
  },
  "preview.enableFrontmatterTags": {
    type: "boolean",
    group: "preview",
  },
  "preview.enableHashesForFMTags": {
    type: "boolean",
    group: "preview",
  },
  "preview.enablePrettyRefs": {
    type: "boolean",
    group: "preview",
  },
  "preview.enableKatex": {
    type: "boolean",
    group: "preview",
  },
  "preview.automaticallyShowPreview": {
    type: "boolean",
    group: "preview",
  },
  "preview.theme": {
    type: "select",
    enum: ["dark", "light", "custom"],
    group: "preview",
  },
  "publishing.enableFMTitle": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.enableNoteTitleForLink": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.enableFrontmatterTags": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.enableHashesForFMTags": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.enablePrettyRefs": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.enableKatex": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.enableHierarchyDisplay": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.hierarchyDisplayTitle": {
    type: "string",
    group: "publishing",
  },
  "publishing.assetsPrefix": {
    type: "string",
    group: "publishing",
  },
  "publishing.canonicalBaseUrl": {
    type: "string",
    group: "publishing",
  },
  "publishing.copyAssets": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.customHeaderPath": {
    type: "string",
    group: "publishing",
  },
  "publishing.ga.tracking": {
    type: "string",
    group: "publishing",
  },
  "publishing.siteFaviconPath": {
    type: "string",
    group: "publishing",
  },
  "publishing.logoPath": {
    type: "string",
    group: "publishing",
  },
  "publishing.siteIndex": {
    type: "string",
    group: "publishing",
  },
  "publishing.siteHierarchies": {
    type: "array",
    group: "publishing",
  },
  "publishing.enableSiteLastModified": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.siteRootDir": {
    type: "string",
    group: "publishing",
  },
  "publishing.siteUrl": {
    type: "string",
    group: "publishing",
  },
  "publishing.enableBackLinks": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.enableRandomlyColoredTags": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.seo.title": {
    type: "string",
    group: "publishing",
  },
  "publishing.seo.description": {
    type: "string",
    group: "publishing",
  },
  "publishing.seo.author": {
    type: "string",
    group: "publishing",
  },
  "publishing.seo.twitter": {
    type: "string",
    group: "publishing",
  },
  "publishing.seo.image.url": {
    type: "string",
    group: "publishing",
  },
  "publishing.seo.image.alt": {
    type: "string",
    group: "publishing",
  },
  "publishing.github.cname": {
    type: "string",
    group: "publishing",
  },
  "publishing.github.enableEditLink": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.github.editLinkText": {
    type: "string",
    group: "publishing",
  },
  "publishing.github.editBranch": {
    type: "string",
    group: "publishing",
  },
  "publishing.github.editViewMode": {
    type: "select",
    enum: ["tree", "edit"],
    group: "publishing",
  },
  "publishing.github.editRepository": {
    type: "string",
    group: "publishing",
  },
  "publishing.enablePrettyLinks": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.enableTaskNotes": {
    type: "boolean",
    group: "publishing",
  },
  "publishing.theme": {
    type: "select",
    enum: ["dark", "light", "custom"],
    group: "publishing",
  },
  "publishing.hierarchy": {
    type: "object",
    group: "publishing",
  },
  "publishing.searchMode": {
    type: "select",
    enum: [SearchMode.LOOKUP, SearchMode.SEARCH],
    group: "publishing",
  },
  "publishing.sidebarPath": {
    type: "string",
    group: "publishing",
  },
  "dev.enableLinkCandidates": {
    type: "boolean",
    group: "dev",
  },
  "dev.enableExportPodV2": {
    type: "boolean",
    group: "dev",
  },
  "dev.enableSelfContainedVaults": {
    type: "boolean",
    group: "dev",
  },
  "dev.enableExperimentalIFrameNoteRef": {
    type: "boolean",
    group: "dev",
  },
  "dev.enableEngineV3": {
    type: "boolean",
    group: "dev",
  },
};

const configSortOrder = [
  "commands",
  "workspace",
  "preview",
  "publishing",
  "dev",
];

export const getSortedConfig = () => {
  return Object.keys(dendronConfig).sort(
    (a, b) =>
      configSortOrder.indexOf(a.split(".")[0]) -
      configSortOrder.indexOf(b.split(".")[0])
  );
};
