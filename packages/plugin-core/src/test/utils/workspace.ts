import { DVault, StrictConfigV5 } from "@dendronhq/common-all";

export class WorkspaceTestUtils {
  /**
   * Hardcoded version of the default config.
   */
  static generateDefaultConfig({
    vaults,
    duplicateNoteBehavior,
  }: {
    vaults: DVault[];
    duplicateNoteBehavior: StrictConfigV5["publishing"]["duplicateNoteBehavior"];
  }) {
    return {
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
        insertNote: {
          initialValue: "templates",
        },
        insertNoteLink: {
          aliasMode: "none",
          enableMultiSelect: false,
        },
        insertNoteIndex: {
          enableMarker: false,
        },
      },
      workspace: {
        vaults,
        journal: {
          dailyDomain: "daily",
          name: "journal",
          dateFormat: "y.MM.dd",
          addBehavior: "childOfDomain",
        },
        scratch: {
          name: "scratch",
          dateFormat: "y.MM.dd.HHmmss",
          addBehavior: "asOwnDomain",
        },
        task: {
          name: "",
          dateFormat: "",
          addBehavior: "childOfCurrent",
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
          createTaskSelectionType: "selection2link",
        },
        graph: {
          zoomSpeed: 1,
        },
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
        enablePrettyLinks: true,
        duplicateNoteBehavior,
      },
    };
  }
}
