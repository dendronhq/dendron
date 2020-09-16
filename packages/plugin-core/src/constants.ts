export const DENDRON_WS_NAME = "dendron.code-workspace";
export const extensionQualifiedId = `dendron.dendron`;
// export const DENDRON_ENV = {
//     DENDRON_WORKSPACE_FOLDERS: "DENDRON_WORKSPACE_FOLDERS"
// };

type KeyBinding = {
  key?: string;
  mac?: string;
  windows?: string;
  when?: string;
};

type CommandEntry = {
  key: string;
  title: string;
  keybindings?: KeyBinding;
  group: "notes" | "workspace" | "pods" | "dev" | "hierarchies" | "navigation";
  /**
   * Skip doc generation
   */
  skipDocs?: boolean;
  desc?: string;
  docs?: string;
  docLink?: string;
  docAnchor?: string;
  docPreview?: string;
};

const CMD_PREFIX = "Dendron:";
export const ICONS = {
  STUB: "gist-new",
  SCHEMA: "repo",
};

export const DENDRON_COMMANDS: { [key: string]: CommandEntry } = {
  // --- Notes
  GOTO_NOTE: {
    key: "dendron.gotoNote",
    // no prefix, we don't want to show this command
    title: `Goto Note`,
    group: "notes",
    skipDocs: true,
  },
  CREATE_DAILY_JOURNAL_NOTE: {
    key: "dendron.createDailyJournalNote",
    title: `${CMD_PREFIX} Create Daily Journal Note`,
    group: "notes",
    keybindings: {
      key: "ctrl+shift+i",
      mac: "cmd+shift+i",
      when: "editorFocus",
    },
    desc: "Create a global journal note",
    docLink: "dendron.topic.special-notes.md",
    docPreview:
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/notes.daily.gif)",
  },
  CREATE_JOURNAL_NOTE: {
    key: "dendron.createJournalNote",
    title: `${CMD_PREFIX} Create Journal Note`,
    group: "notes",
    keybindings: {
      key: "ctrl+shift+j",
      mac: "cmd+shift+j",
      when: "editorFocus",
    },
    desc: "Create a hierarchy specific journal note",
    docLink: "dendron.topic.special-notes.md",
    docPreview: `<a href="https://www.loom.com/share/da562a166af9427e908a76be8bc38355"><img src="https://cdn.loom.com/sessions/thumbnails/da562a166af9427e908a76be8bc38355-with-play.gif"></a>`,
  },
  CREATE_SCRATCH_NOTE: {
    key: "dendron.createScratchNote",
    title: `${CMD_PREFIX} Create Scratch Note`,
    group: "notes",
    keybindings: {
      key: "ctrl+shift+s",
      mac: "cmd+shift+s",
    },
    desc: "Create a hierarchy specific scratch note",
    docLink: "dendron.topic.special-notes.md",
    docPreview: `<a href="https://www.loom.com/share/104a3e0bb10f4012a831194d02483e4a"> <img style="" src="https://cdn.loom.com/sessions/thumbnails/104a3e0bb10f4012a831194d02483e4a-with-play.gif"> </a>`,
  },
  COPY_NOTE_LINK: {
    key: "dendron.copyNoteLink",
    title: `${CMD_PREFIX} Copy Note Link`,
    group: "notes",
    desc: "Copy wiki link to note",
    docLink: "dendron.topic.commands.md",
    docPreview:
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/command.copy-link.gif)",
    keybindings: {
      key: "ctrl+shift+c",
      mac: "cmd+shift+c",
      when: "editorFocus",
    },
  },
  COPY_NOTE_REF: {
    key: "dendron.copyNoteRef",
    title: `${CMD_PREFIX} Copy Note Ref`,
    group: "notes",
    desc: "Copies a reference to the current open document",
    docLink: "dendron.topic.commands.md",
    docs: [
      "Lets you quickly create a [[note reference| dendron.topic.refs]] to the current note.",
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/ref-note.gif)",
      "",
      "If you have a header selected while running this command, it will copy the note ref with the selected header to the next note ref",
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/refs.copy-selection.gif)",
    ].join("\n"),
    docPreview: "",
    keybindings: {
      key: "ctrl+shift+r",
      mac: "cmd+shift+r",
      when: "editorFocus",
    },
  },
  DELETE_NODE: {
    key: "dendron.deleteNode",
    title: `${CMD_PREFIX} Delete Node`,
    group: "notes",
    keybindings: {
      key: "ctrl+shift+d",
      mac: "cmd+shift+d",
    },
    desc: "Delete a note or schema",
    docLink: "dendron.topic.lookup.md",
    docPreview: "",
  },
  NEW_NOTE_FROM_SELECTION: {
    key: "dendron.newNoteFromSelection",
    title: `${CMD_PREFIX} New Note From Selection`,
    group: "notes",
    desc:
      "Create new note based on a selection. Remove selection from original note.",
    docLink: "dendron.topic.commands.md",
    docPreview:
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/notes.new-from-select.gif)",
  },
  RENAME_NOTE: {
    key: "dendron.renameNote",
    title: `${CMD_PREFIX} Rename Note`,
    group: "notes",
    desc: "Rename a note and all backlinks",
    docLink: "dendron.topic.commands.md",
    docPreview:
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/command-rename.gif)",
  },
  // --- Lookup
  LOOKUP: {
    key: "dendron.lookup",
    title: `${CMD_PREFIX} Lookup`,
    group: "navigation",
    keybindings: {
      mac: "cmd+L",
      key: "ctrl+l",
    },
    desc: "Initiate note lookup",
    docs: ["((ref: [[dendron.topic.lookup]]#notes,1:#schemas))"].join("\n"),
    docLink: "dendron.topic.lookup.md",
    docPreview: "",
  },
  LOOKUP_SCHEMA: {
    key: "dendron.lookupSchema",
    title: `${CMD_PREFIX} Lookup Schema`,
    group: "navigation",
    keybindings: {
      mac: "cmd+shift+L",
      key: "ctrl+shift+l",
    },
    desc: "Initiate schema lookup",
    docLink: "dendron.topic.lookup.md",
    docPreview:
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/schema-lookup.gif)",
  },
  RELOAD_INDEX: {
    key: "dendron.reloadIndex",
    title: `${CMD_PREFIX} Reload Index`,
    group: "hierarchies",
    desc:
      "Reload the index. Necessary for Dendron to pick up on schema changes.",
    docLink: "dendron.topic.commands.md",
    docPreview: "",
  },
  // --- Hierarchies
  ARCHIVE_HIERARCHY: {
    key: "dendron.archiveHierarchy",
    title: `${CMD_PREFIX} Archive Hierarchy`,
    group: "hierarchies",
    desc: "Move current note and all children under the `archive` hierarchy",
    docs: [
      "This is a convenience method around `Refactor Hierarchy` for the case of archiving hierarchies you are no longer using. For example, if you were currently at `pro.foo`, running `Archive Hierarchy` would be equivalent to running `Refactor Hierarchy` with the following arguments:",
      "- matcher: `pro.foo`",
      "- replacement:  `archive.pro.foo`",
    ].join("\n"),
    docLink: "dendron.topic.commands.md",
    docPreview: `<a href="https://www.loom.com/share/9698d5a4451b49d8b107f3ff67d97877">  <img style="" src="https://cdn.loom.com/sessions/thumbnails/9698d5a4451b49d8b107f3ff67d97877-with-play.gif"> </a>`,
  },
  REFACTOR_HIERARCHY: {
    key: "dendron.refactorHierarchy",
    title: `${CMD_PREFIX} Refactor Hierarchy`,
    group: "hierarchies",
    desc: "Update hierarchy using regex",
    docs: [
      "Like `Rename Note` but works on an entire hierarchy of notes. This command takes two arguments: ",
      "- matcher: regex that matches text you want to capture for replacement",
      "- replacer: regex that represents text you want to use as replacement",
      "",
      "After running the command, you will be taken to a preview that shows all files that will be affected. You will be given an option in a dropdown to either proceed with the refactor or cancel the operation. ",
      "",
      "- NOTE: Dendron will warn you if refactoring will overwrite existing files. You will need to either change your `replacer` or move the affected files before Dendron will perform a refactor",
      "",
      "Refactor Hierarchy is ",
      "https://discordapp.com/channels/717965437182410783/743194856788328497/743195382795993291",
    ].join("\n"),
    docLink: "dendron.topic.commands.md",
    docPreview: `<a href="https://www.loom.com/share/11d90a86fd1348a5a504406b52d79f85"> <img style="" src="https://cdn.loom.com/sessions/thumbnails/11d90a86fd1348a5a504406b52d79f85-with-play.gif"> </a>`,
  },
  GO_UP_HIERARCHY: {
    key: "dendron.goUpHierarchy",
    title: `${CMD_PREFIX} Go Up`,
    group: "hierarchies",
    keybindings: {
      mac: "cmd+shift+up",
      key: "ctrl+shift+up",
      when: "editorFocus",
    },
    desc: "Go to closet non-stub parent of the currently open note",
    docLink: "dendron.topic.commands.md",
    docPreview:
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/hierarchy.go-up.gif)",
  },
  GO_NEXT_HIERARCHY: {
    key: "dendron.goNextHierarchy",
    title: `${CMD_PREFIX} Go Next Sibling`,
    group: "hierarchies",
    keybindings: {
      mac: "cmd+shift+right",
      key: "ctrl+shift+right",
      when: "editorFocus",
    },
    desc: "Go to the next sibling",
    docLink: "dendron.topic.commands.md",
    docPreview:
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/hierarchy.go-sibling.gif)",
  },
  GO_PREV_HIERARCHY: {
    key: "dendron.goPrevHierarchy",
    title: `${CMD_PREFIX} Go Previous Sibling`,
    group: "hierarchies",
    keybindings: {
      mac: "cmd+shift+left",
      key: "ctrl+shift+left",
      when: "editorFocus",
    },
    desc: "Go to the previous sibling",
    docLink: "dendron.topic.commands.md",
    docPreview:
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/hierarchy.go-sibling.gif)",
  },
  GO_DOWN_HIERARCHY: {
    key: "dendron.goDownHierarchy",
    title: `${CMD_PREFIX} Go Down`,
    group: "hierarchies",
    keybindings: {
      mac: "cmd+shift+down",
      key: "ctrl+shift+down",
      when: "editorFocus",
    },
    desc: "Go down the hierarchy",
    docLink: "dendron.topic.commands.md",
    docPreview:
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/hierarchy.go-down.gif)",
  },
  // --- Workspace
  INIT_WS: {
    key: "dendron.initWS",
    title: `${CMD_PREFIX} Initialize Workspace`,
    group: "workspace",
    desc: "Create a new workspace",
    docLink: "dendron.topic.commands.md",
    docPreview:
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/workspace-init.gif)",
  },
  CHANGE_WS: {
    key: "dendron.changeWS",
    title: `${CMD_PREFIX} Change Workspace`,
    group: "workspace",
    desc: "Change into existing workspace",
    docs: [
      "Dendron will create a `dendron.code-workspace` file in specified directory and then open the workspace (if a workspace file already exists, it will use that). It will also create a `root.md` file in that directory if it doesn't exist (currently this is part of the internal working of dendron).",
      "",
      "Dendron **does not** delete or overwrite any files during the **Change Workspace** operation.",
    ].join("\n"),
    docLink: "dendron.topic.commands.md",
    docPreview: "",
  },
  UPGRADE_SETTINGS: {
    key: "dendron.upgradeSettings",
    title: `${CMD_PREFIX} Upgrade Settings`,
    group: "workspace",
    desc:
      "Upgrade to the latest Dendron settings. You shouldn't need to run this manually. Its run everytime you get a Dendron update.",
    docLink: "dendron.topic.commands.md",
    docPreview: "",
    skipDocs: true,
  },
  // --- Pods
  BUILD_POD: {
    key: "dendron.buildPod",
    title: `${CMD_PREFIX} Build Pod`,
    group: "pods",
    desc:
      "Build your notes for export. Currently, only export to github pages is supported.",
    docLink: "dendron.topic.pod.md",
    docPreview: "",
  },
  CONFIGURE_POD: {
    key: "dendron.configurePod",
    title: `${CMD_PREFIX} Configure Pod`,
    group: "pods",
    desc: "Update your pod configuration",
    docLink: "dendron.topic.pod.md",
    docPreview:
      "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/pods.configure.gif)",
  },
  IMPORT_POD: {
    key: "dendron.importPod",
    title: `${CMD_PREFIX} Import Pod`,
    group: "pods",
    desc:
      "Import notes from an external data source. Currently, only the local file system is supported",
    docLink: "dendron.topic.pod.md",
    docPreview: "",
  },
  EXPORT_POD: {
    key: "dendron.exportPod",
    title: `${CMD_PREFIX} Export Pod`,
    group: "pods",
    desc:
      "Export notes to an external data source. Currently only JSON is supported. ",
    docLink: "dendron.topic.pod.md",
    docPreview: `<a href="https://www.loom.com/share/d49e5f4155af485cadc9cd810b6cab28"> <img src="https://cdn.loom.com/sessions/thumbnails/d49e5f4155af485cadc9cd810b6cab28-with-play.gif"> </a>`,
  },
  COPY_NOTE_URL: {
    key: "dendron.copyNoteURL",
    title: `${CMD_PREFIX} Copy Note URL`,
    group: "pods",
    desc: "Get URL of current note from published site",
    docs:
      "If you highlight a header, will copy the url with the header set as the anchor",
    docLink: "",
    docPreview: `![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/notes.copy-url.gif)`,
    keybindings: {
      mac: "cmd+shift+u",
      windows: "ctrl+shift+u",
    },
  },
  // --- Misc
  OPEN_LINK: {
    key: "dendron.openLink",
    title: `${CMD_PREFIX} Open Link`,
    group: "navigation",
    desc: "Open link to external file (eg. pdf, .mov, etc) use system default",
    docLink: "dendron.topic.links.md",
    docPreview: `<a href="https://www.loom.com/share/01250485e20a4cdca2a053dd6047ac68"><img src="https://cdn.loom.com/sessions/thumbnails/01250485e20a4cdca2a053dd6047ac68-with-play.gif"> </a>`,
  },
  SHOW_HELP: {
    key: "dendron.showHelp",
    title: `${CMD_PREFIX} Show Help`,
    group: "workspace",
    desc:
      "Dendron will open your current browser to the [[cheatsheet|dendron.cheatsheet]] page. ",
    docLink: "dendron.topic.commands.md",
    docPreview: `![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/workbench.help.gif)`,
  },
  SHOW_PREVIEW: {
    key: "dendron.showPreview",
    title: `${CMD_PREFIX} Show Preview`,
    group: "notes",
    keybindings: {
      windows: "windows+ctrl+p",
      mac: "cmd+ctrl+p",
    },
    desc: "Show Markdown Preview",
    docLink: "dendron.topic.commands.md",
    docPreview: "",
  },
  // --- Dev
  DOCTOR: {
    key: "dendron.dev.doctor",
    title: `${CMD_PREFIX} Doctor`,
    group: "dev",
    desc: "Auto fix issues with frontmatter",
    docs: [
      "This makes sure your workspace is up to date. It will execute the following actions:",
      "- add ids and titles to the frontmatter of all notes that are missing it",
      "- setup a `docs` folder if it doesn't exist. Required if you want to [[publish | dendron.topic.publishing]] your notes",
    ].join("\n"),
    docLink: "dendron.topic.commands.md",
    docPreview: `<a href="https://www.loom.com/share/bd045f708f8e474193de8e3de0dc820f"> <img style="" src="https://cdn.loom.com/sessions/thumbnails/bd045f708f8e474193de8e3de0dc820f-with-play.gif"> </a>`,
  },
  RESET_CONFIG: {
    key: "dendron.dev.resetConfig",
    title: `${CMD_PREFIX}Dev: Reset Config`,
    group: "dev",
    skipDocs: true,
  },
  OPEN_LOGS: {
    key: "dendron.dev.openLogs",
    title: `${CMD_PREFIX}Dev: Open Logs`,
    group: "dev",
    desc: "Open Dendron logs for current session",
    docLink: "dendron.topic.commands.md",
    docPreview: "",
  },
};

export const DENDRON_CHANNEL_NAME = "Dendron";

export const WORKSPACE_STATE = {
  WS_VERSION: "dendron.wsVersion",
};

export const GLOBAL_STATE = {
  VERSION: "dendron.version",
  VERSION_PREV: "dendron.versionPrev",
  /**
   * Set the first time a dendron workspace is activated
   */
  DENDRON_FIRST_WS: "dendron.first_ws",
  DENDRON_FIRST_WS_TUTORIAL_STEP: "dendron.first_ws.tutorial_step",
  /**
   * Extension is being debugged
   */
  VSCODE_DEBUGGING_EXTENSION: "dendron.vscode_debugging_extension",
};

// type ConfigEntry = {
//   key: string;
//   default?: any;
// };
// type ConfigDict = { [k: keyof typeof CONFIG]: ConfigEntry};

export type ConfigKey = keyof typeof CONFIG;

const _noteDateDesc = (type: "journal" | "scratch") =>
  `date format used for ${type} notes`;
const _noteNameDesc = (type: "journal" | "scratch") =>
  `named used for ${type} notes`;
const _noteAddBehaviorDesc = (type: "journal" | "scratch") =>
  `strategy for adding new ${type} notes`;
export const _noteAddBehaviorEnum = [
  "childOfDomain",
  "childOfDomainNamespace",
  "childOfCurrent",
  "asOwnDomain",
];

export const CONFIG = {
  // --- journals
  DAILY_JOURNAL_DOMAIN: {
    key: "dendron.dailyJournalDomain",
    type: "string",
    default: "daily",
    description: "domain where daily journals are kept",
  },
  DEFAULT_JOURNAL_NAME: {
    key: "dendron.defaultJournalName",
    type: "string",
    default: "journal",
    description: _noteNameDesc("journal"),
  },
  DEFAULT_JOURNAL_DATE_FORMAT: {
    key: "dendron.defaultJournalDateFormat",
    type: "string",
    default: "Y-MM-DD",
    description: _noteDateDesc("journal"),
  },
  DEFAULT_JOURNAL_ADD_BEHAVIOR: {
    key: "dendron.defaultJournalAddBehavior",
    default: "childOfDomain",
    description: _noteAddBehaviorDesc("journal"),
    enum: _noteAddBehaviorEnum,
  },
  DEFAULT_SCRATCH_NAME: {
    key: "dendron.defaultScratchName",
    type: "string",
    default: "scratch",
    description: _noteNameDesc("scratch"),
  },
  DEFAULT_SCRATCH_DATE_FORMAT: {
    key: "dendron.defaultScratchDateFormat",
    type: "string",
    default: "Y-MM-DD-HHmmss",
    description: _noteDateDesc("scratch"),
  },
  DEFAULT_SCRATCH_ADD_BEHAVIOR: {
    key: "dendron.defaultScratchAddBehavior",
    default: "asOwnDomain",
    description: _noteAddBehaviorDesc("scratch"),
    enum: _noteAddBehaviorEnum,
  },
  COPY_NOTE_URL_ROOT: {
    key: "dendron.copyNoteUrlRoot",
    type: "string",
    description: "Override root url when getting note url",
  },
  // --- root dir
  ROOT_DIR: {
    key: "dendron.rootDir",
    type: "string",
    default: "",
    description: "location of dendron workspace",
  },
  // --- other
  NOTESDIR_PATH: {
    key: "dendron.notesDirPath",
    type: "string",
    desc: "Path to notesdir executable",
  },
  SKIP_PROMPT: {
    key: "dendron.skipPrompt",
    type: "boolean",
    default: false,
    descriptionip:
      "whether dendron prompts for confirmation for certain actions",
  },
};
