import { IntermediateDendronConfig } from "@dendronhq/common-all";

export const getSchemaConfig = (config: IntermediateDendronConfig) => [
  {
    label: "dev",
    description: "Development related options",
    children: [
      {
        label: "nextServerUrl",
        type: "string",
        description: "Custom next server",
        default: config.dev?.nextServerUrl,
      },
      {
        label: "nextStaticRoot",
        type: "string",
        description: "Static assets for next",
        default: config.dev?.nextStaticRoot,
      },
      {
        label: "engineServerPort",
        type: "number",
        description:
          "What port to use for engine server. Default behavior is to create at startup",
        default: config.dev?.engineServerPort,
      },
      {
        label: "enableLinkCandidates",
        type: "boolean",
        description:
          "Enable displaying and indexing link candidates. Default is false",
        default: config.dev?.enableLinkCandidates,
      },
      {
        label: "enablePreviewV2",
        type: "boolean",
        description: "Enable new preview as default",
        default: config.dev?.enablePreviewV2,
      },
      {
        label: "forceWatcherType",
        type: "enum",
        enum: ["plugin", "engine"],
        description:
          "Force the use of a specific type of watcher.\n\n- plugin: Uses VSCode's builtin watcher\n- engine: Uses the engine watcher, watching the files directly without VSCode",
        default: config.dev?.forceWatcherType,
      },
      {
        label: "enableExportPodV2",
        type: "boolean",
        description: "Enable export pod v2",
        default: config.dev?.enableExportPodV2,
      },
      {
        label: "enableSelfContainedVaults",
        type: "boolean",
        description:
          "Sets self contained vaults as the default vault type. Dendron can read self-contained vaults even if this option is not enabled, but it will only create self contained vaults if this option is enabled.",
        default: config.dev?.enableSelfContainedVaults,
      },
    ],
  },
  {
    label: "commands",
    children: [
      {
        label: "lookup",
        type: "object",
        children: [
          {
            label: "note",
            type: "object",
            children: [
              {
                label: "selectionMode",
                type: "enum",
                enum: ["extract", "link", "none"],
                default: config.commands.lookup.note.selectionMode,
                description:
                  "String literal type generated from  {@link  NoteLookupSelectionBehaviorEnum }",
              },
              {
                label: "vaultSelectionModeOnCreate",
                type: "enum",
                default: config.commands.lookup.note.vaultSelectionModeOnCreate,
                enum: ["smart", "alwaysPrompt"],
              },
              {
                label: "randomNote",
                description:
                  "Namespace for configuring  {@link  RandomNoteCommand }",
                type: "object",
                children: [
                  {
                    label: "include",
                    type: "array",
                    items: {
                      type: "string",
                    },
                    default: config.commands.randomNote.include,
                  },
                  {
                    label: "exclude",
                    type: "array",
                    items: {
                      type: "string",
                    },
                    default: config.commands.randomNote.exclude,
                  },
                ],
              },
              {
                label: "insertNoteLink",
                description:
                  "Namespace for configuring  {@link  InsertNoteLinkCommand }",
                type: "object",
                children: [
                  {
                    label: "aliasMode",
                    type: "enum",
                    default: config.commands.insertNoteLink.aliasMode,
                    enum: ["snippet", "selection", "title", "prompt", "none"],
                    description:
                      "Enum definitions of possible alias mode values",
                  },
                  {
                    label: "enableMultiSelect",
                    type: "boolean",
                    default: config.commands.insertNoteLink.enableMultiSelect,
                  },
                ],
              },
              {
                label: "insertNoteIndex",
                description:
                  "Namespace for configuring  {@link  InsertNoteIndexCommand }",
                type: "object",
                children: [
                  {
                    label: "enableMarker",
                    type: "boolean",
                    default: config.commands.insertNoteIndex.enableMarker,
                  },
                ],
              },
              {
                label: "copyNoteLink",
                type: "object",
                description:
                  "Namespace for configuring  {@link  CopyNoteLinkCommand }",
                children: [
                  {
                    label: "nonNoteFile",
                    type: "object",
                    children: [
                      {
                        label: "anchorType",
                        type: "enum",
                        default:
                          config.commands.copyNoteLink.nonNoteFile?.anchorType,
                        enum: ["line", "block", "prompt"],
                        description:
                          '"line" uses line numbers (`L23`), "block" inserts block anchors (`^xf1g...`). "prompt" means prompt the user to select one.',
                      },
                    ],
                  },
                ],
              },
              {
                label: "templateHierarchy",
                type: "string",
                default: config.commands.templateHierarchy,
                description:
                  "Default template hiearchy used when running commands like `Apply template`",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "workspace",
    children: [
      {
        label: "dendronVersion",
        type: "string",
        default: config.workspace.dendronVersion,
      },
      {
        label: "journal",
        type: "object",
        children: [
          {
            label: "dailyDomain",
            type: "string",
            default: config.workspace.journal.dailyDomain,
          },
          {
            label: "dailyVault",
            type: "string",
            default: config.workspace.journal.dailyVault,
          },
          {
            label: "name",
            type: "string",
            default: config.workspace.journal.name,
          },
          {
            label: "dateFormat",
            type: "string",
            default: config.workspace.journal.dateFormat,
          },
          {
            label: "addBehavior",
            type: "enum",
            enum: [
              "childOfDomain",
              "childOfDomainNamespace",
              "childOfCurrent",
              "asOwnDomain",
            ],
            default: config.workspace.journal.addBehavior,
            description:
              "Enum definition of possible note add behavior values.",
          },
        ],
      },
      {
        label: "scratch",
        type: "object",
        children: [
          {
            label: "name",
            type: "string",
            default: config.workspace.scratch.name,
          },
          {
            label: "dateFormat",
            type: "string",
            default: config.workspace.scratch.dateFormat,
          },
          {
            label: "addBehavior",
            type: "enum",
            default: config.workspace.scratch.addBehavior,
            enum: [
              "childOfDomain",
              "childOfDomainNamespace",
              "childOfCurrent",
              "asOwnDomain",
            ],
            description:
              "Enum definition of possible note add behavior values.",
          },
        ],
      },
      {
        label: "task",
        type: "object",
        children: [
          {
            label: "statusSymbols",
            type: "list",
            description:
              "Maps each status to a symbol, word, or sentence. This will be displayed for the task.",
            default: config.workspace.task.statusSymbols,
          },
          {
            label: "taskCompleteStatus",
            type: "array",
            items: {
              type: "string",
            },
            default: config.workspace.task.taskCompleteStatus,
          },
          {
            label: "prioritySymbols",
            type: "list",
            description:
              "Maps each priority to a symbol, word, or sentence. This will be displayed for the task.",
            default: config.workspace.task.prioritySymbols,
          },
          {
            label: "todoIntegration",
            type: "boolean",
            default: config.workspace.task.todoIntegration,
            description:
              'Add a "TODO: <note title>" entry to the frontmatter of task notes. This can simplify integration with various Todo extensions like Todo Tree.',
          },
          {
            label: "name",
            type: "string",
            default: config.workspace.task.name,
          },
          {
            label: "dateFormat",
            type: "string",
            default: config.workspace.task.dateFormat,
          },
          {
            label: "createTaskSelectionType",
            type: "enum",
            default: config.workspace.task.createTaskSelectionType,
            enum: ["selection2link", "selectionExtract", "none"],
            description:
              "The default selection type to use in Create Task Note command.",
          },
          {
            label: "addBehavior",
            type: "enum",
            enum: [
              "childOfDomain",
              "childOfDomainNamespace",
              "childOfCurrent",
              "asOwnDomain",
            ],
            default: config.workspace.task.addBehavior,
            description:
              "Enum definition of possible note add behavior values.",
          },
        ],
      },
      {
        label: "graph",
        type: "object",
        description: "Namespace for all graph related configurations.",
        children: [
          {
            label: "zoomSpeed",
            type: "number",
            default: config.workspace.graph.zoomSpeed,
          },
          {
            label: "createStub",
            type: "boolean",
            description:
              "If true, create a note if it hasn't been created already when clicked on a graph node",
            default: config.workspace.graph.createStub,
          },
        ],
      },
      {
        label: "disableTelemetry",
        type: "boolean",
        default: config.workspace.disableTelemetry,
      },
      {
        label: "enableAutoCreateOnDefinition",
        type: "boolean",
        default: config.workspace.enableAutoCreateOnDefinition,
      },
      {
        label: "enableXVaultWikiLink",
        type: "boolean",
        default: config.workspace.enableXVaultWikiLink,
      },
      {
        label: "enableHandlebarTemplates",
        type: "boolean",
        default: config.workspace.enableHandlebarTemplates,
      },
      {
        label: "enableRemoteVaultInit",
        type: "boolean",
        default: config.workspace.enableRemoteVaultInit,
      },
      {
        label: "workspaceVaultSyncMode",
        type: "enum",
        enum: ["skip", "noPush", "noCommit", "sync"],
        default: config.workspace.workspaceVaultSyncMode,
      },
      {
        label: "enableAutoFoldFrontmatter",
        type: "boolean",
        default: config.workspace.enableAutoFoldFrontmatter,
      },
      {
        label: "enableUserTags",
        type: "boolean",
        default: config.workspace.enableUserTags,
      },
      {
        label: "enableHashTags",
        type: "boolean",
        default: config.workspace.enableHashTags,
      },
      {
        label: "enableFullHierarchyNoteTitle",
        type: "boolean",
        default: config.workspace.enableFullHierarchyNoteTitle,
      },
      {
        label: "maxPreviewsCached",
        type: "number",
        default: config.workspace.maxPreviewsCached,
      },
      {
        label: "maxNoteLength",
        type: "number",
        default: config.workspace.maxNoteLength,
      },
      {
        label: "enableEditorDecorations",
        type: "boolean",
        default: config.workspace.enableEditorDecorations,
      },
      {
        label: "feedback",
        type: "boolean",
        default: config.workspace.feedback,
      },
      {
        label: "apiEndpoint",
        type: "string",
        default: config.workspace.apiEndpoint,
      },
    ],
  },
  {
    label: "preview",
    children: [
      {
        label: "enableFMTitle",
        type: "boolean",
        default: config.preview.enableFMTitle,
      },
      {
        label: "enableNoteTitleForLink",
        type: "boolean",
        default: config.preview.enableNoteTitleForLink,
      },
      {
        label: "enableFrontmatterTags",
        type: "boolean",
        default: config.preview.enableFrontmatterTags,
      },
      {
        label: "enableHashesForFMTags",
        type: "boolean",
        default: config.preview.enableHashesForFMTags,
      },
      {
        label: "enableMermaid",
        type: "boolean",
        default: config.preview.enableMermaid,
      },
      {
        label: "enablePrettyRefs",
        type: "boolean",
        default: config.preview.enablePrettyRefs,
      },
      {
        label: "enableKatex",
        type: "boolean",
        default: config.preview.enableKatex,
      },
      {
        label: "automaticallyShowPreview",
        type: "boolean",
        default: config.preview.automaticallyShowPreview,
      },
      {
        label: "theme",
        type: "enum",
        enum: ["dark", "light", "custom"],
        default: config.preview.theme,
      },
    ],
  },
  {
    label: "publishing",
    children: [
      {
        label: "enableFMTitle",
        type: "boolean",
        default: config.publishing?.enableFMTitle,
      },
      {
        label: "enableHierarchyDisplay",
        type: "boolean",
        default: config.publishing?.enableHierarchyDisplay,
      },
      {
        label: "hierarchyDisplayTitle",
        type: "string",
        default: config.publishing?.hierarchyDisplayTitle,
      },
      {
        label: "enableNoteTitleForLink",
        type: "boolean",
        default: config.publishing?.enableNoteTitleForLink,
      },
      {
        label: "enableMermaid",
        type: "boolean",
        default: config.publishing?.enableMermaid,
      },
      {
        label: "enablePrettyRefs",
        type: "boolean",
        default: config.publishing?.enablePrettyRefs,
      },
      {
        label: "enableBackLinks",
        type: "boolean",
        default: config.publishing?.enableBackLinks,
      },
      {
        label: "enableKatex",
        type: "boolean",
        default: config.publishing?.enableKatex,
      },
      {
        label: "assetsPrefix",
        type: "string",
        default: config.publishing?.assetsPrefix,
      },
      {
        label: "copyAssets",
        type: "boolean",
        default: config.publishing?.copyAssets,
      },
      {
        label: "canonicalBaseUrl",
        type: "string",
        default: config.publishing?.canonicalBaseUrl,
      },
      {
        label: "customHeaderPath",
        type: "string",
        default: config.publishing?.customHeaderPath,
      },
      {
        label: "ga",
        type: "object",
        children: [
          {
            label: "tracking",
            type: "string",
            default: config.publishing?.ga?.tracking,
          },
        ],
      },
      {
        label: "logoPath",
        type: "string",
        default: config.publishing?.logoPath,
      },
      {
        label: "siteFaviconPath",
        type: "string",
        default: config.publishing?.siteFaviconPath,
      },
      {
        label: "siteIndex",
        type: "string",
        default: config.publishing?.siteIndex,
      },
      {
        label: "siteHierarchies",
        type: "array",
        items: {
          type: "string",
        },
        default: config.publishing?.siteHierarchies,
      },
      {
        label: "enableSiteLastModified",
        type: "boolean",
        default: config.publishing?.enableSiteLastModified,
      },
      {
        label: "siteRootDir",
        type: "string",
        default: config.publishing?.siteRootDir,
      },
      { label: "siteUrl", type: "string", default: config.publishing?.siteUrl },
      {
        label: "enableFrontmatterTags",
        type: "boolean",
        default: config.publishing?.enableFrontmatterTags,
      },
      {
        label: "enableHashesForFMTags",
        type: "boolean",
        default: config.publishing?.enableHashesForFMTags,
      },
      {
        label: "enableRandomlyColoredTags",
        type: "boolean",
        default: config.publishing?.enableRandomlyColoredTags,
      },
      {
        label: "enableTaskNotes",
        type: "boolean",
        default: config.publishing?.enableTaskNotes,
      },
      {
        label: "writeStubs",
        type: "boolean",
        default: config.publishing?.writeStubs,
      },
      {
        label: "seo",
        type: "object",
        children: [
          {
            label: "title",
            type: "string",
            default: config.publishing?.seo.title,
          },
          {
            label: "description",
            type: "string",
            default: config.publishing?.seo.description,
          },
          {
            label: "author",
            type: "string",
            default: config.publishing?.seo.author,
          },
          {
            label: "twitter",
            type: "string",
            default: config.publishing?.seo.twitter,
          },
          {
            label: "image",
            type: "object",
            children: [
              {
                label: "url",
                type: "string",
                default: config.publishing?.seo.image?.url,
              },
              {
                label: "alt",
                type: "string",
                default: config.publishing?.seo.image?.alt,
              },
            ],
          },
        ],
      },
      {
        label: "github",
        type: "object",
        children: [
          {
            label: "cname",
            type: "string",
            default: config.publishing?.github.cname,
          },
          {
            label: "enableEditLink",
            type: "boolean",
            default: config.publishing?.github.enableEditLink,
          },
          {
            label: "editLinkText",
            type: "string",
            default: config.publishing?.github.editLinkText,
          },
          {
            label: "editBranch",
            type: "string",
            default: config.publishing?.github.editBranch,
          },
          {
            label: "editViewMode",
            type: "enum",
            enum: ["tree", "edit"],
            default: config.publishing?.github.editViewMode,
          },
          {
            label: "editRepository",
            type: "string",
            default: config.publishing?.github.editRepository,
          },
        ],
      },
      {
        label: "theme",
        type: "enum",
        enum: ["dark", "light", "custom"],
        default: config.publishing?.theme,
      },
      {
        label: "segmentKey",
        type: "string",
        default: config.publishing?.segmentKey,
      },
      {
        label: "cognitoUserPoolId",
        type: "string",
        default: config.publishing?.cognitoUserPoolId,
      },
      {
        label: "cognitoClientId",
        type: "string",
        default: config.publishing?.cognitoClientId,
      },
      {
        label: "enablePrettyLinks",
        type: "boolean",
        default: config.publishing?.enablePrettyLinks,
      },
      {
        label: "siteBanner",
        type: "string",
        default: config.publishing?.siteBanner,
      },
    ],
  },
];
