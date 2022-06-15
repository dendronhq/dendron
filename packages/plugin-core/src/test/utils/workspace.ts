import {
  DVault,
  InsertNoteLinkAliasModeEnum,
  LegacyLookupSelectionType,
  NoteAddBehaviorEnum,
  StrictConfigV5,
} from "@dendronhq/common-all";

export class WorkspaceTestUtils {
  /**
   * Hardcoded version of the default config.
   */
  static generateDefaultConfig({
    vaults,
    duplicateNoteBehavior,
  }: {
    vaults: DVault[];
    duplicateNoteBehavior?: StrictConfigV5["publishing"]["duplicateNoteBehavior"];
  }) {
    const config: StrictConfigV5 = {
      version: 5,
      dev: {
        enablePreviewV2: true,
      },
      commands: {
        lookup: {
          note: {
            selectionMode: "extract",
            confirmVaultOnCreate: true,
            vaultSelectionModeOnCreate: "smart",
            leaveTrace: false,
            bubbleUpCreateNew: true,
            fuzzThreshold: 0.2,
          },
        },
        randomNote: {},
        copyNoteLink: {},
        insertNoteLink: {
          aliasMode: InsertNoteLinkAliasModeEnum.none,
          enableMultiSelect: false,
        },
        insertNoteIndex: {
          enableMarker: false,
        },
        templateHierarchy: "template",
      },
      workspace: {
        vaults,
        journal: {
          dailyDomain: "daily",
          name: "journal",
          dateFormat: "y.MM.dd",
          addBehavior: NoteAddBehaviorEnum.childOfDomain,
        },
        scratch: {
          name: "scratch",
          dateFormat: "y.MM.dd.HHmmss",
          addBehavior: NoteAddBehaviorEnum.asOwnDomain,
        },
        task: {
          name: "task",
          dateFormat: "y.MM.dd",
          addBehavior: NoteAddBehaviorEnum.asOwnDomain,
          taskCompleteStatus: ["done", "x"],
          statusSymbols: {
            "": " ",
            wip: "w",
            done: "x",
            assigned: "a",
            moved: "m",
            blocked: "b",
            delegated: "l",
            dropped: "d",
            pending: "y",
          },
          prioritySymbols: {
            H: "high",
            M: "medium",
            L: "low",
          },
          todoIntegration: false,
          createTaskSelectionType: LegacyLookupSelectionType.selection2link,
        },
        graph: {
          zoomSpeed: 1,
          createStub: false,
        },
        enableHandlebarTemplates: true,
        enableAutoCreateOnDefinition: false,
        enableXVaultWikiLink: false,
        enableRemoteVaultInit: true,
        enableUserTags: true,
        enableHashTags: true,
        workspaceVaultSyncMode: "noCommit",
        enableAutoFoldFrontmatter: false,
        enableEditorDecorations: true,
        maxPreviewsCached: 10,
        maxNoteLength: 204800,
        enableFullHierarchyNoteTitle: false,
      },
      preview: {
        enableFMTitle: true,
        enableNoteTitleForLink: true,
        enableFrontmatterTags: true,
        enableHashesForFMTags: false,
        enableMermaid: true,
        enablePrettyRefs: true,
        enableKatex: true,
        automaticallyShowPreview: false,
      },
      publishing: {
        enableFMTitle: true,
        enableFrontmatterTags: true,
        enableHashesForFMTags: false,
        enableKatex: true,
        enableMermaid: true,
        enableNoteTitleForLink: true,
        copyAssets: true,
        enablePrettyRefs: true,
        siteHierarchies: ["root"],
        writeStubs: false,
        siteRootDir: "docs",
        seo: {
          title: "Dendron",
          description: "Personal Knowledge Space",
        },
        github: {
          enableEditLink: true,
          editLinkText: "Edit this page on GitHub",
          editBranch: "main",
          editViewMode: "tree",
        },
        enableSiteLastModified: true,
        enableRandomlyColoredTags: true,
        enableTaskNotes: true,
        enablePrettyLinks: true,
      },
    };
    if (duplicateNoteBehavior) {
      config.publishing.duplicateNoteBehavior = duplicateNoteBehavior;
    }
    return config;
  }
}
