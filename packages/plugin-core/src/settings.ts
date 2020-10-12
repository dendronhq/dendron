import {
  readJSONWithComments,
  assignJSONWithComment,
  writeJSONWithComments,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import {
  ConfigurationTarget,
  WorkspaceConfiguration,
  extensions,
  WorkspaceFolder,
} from "vscode";
import { Logger } from "./logger";
import { DendronWorkspace } from "./workspace";

type CodeConfig = {
  settings?: ConfigChanges;
  extensions?: CodeExtensionsConfig;
  snippetChanges?: any;
};
type CodeExtensionsConfig = {
  recommendations?: string[];
  unwantedRecommendations?: string[];
};

export type ConfigChanges = {
  add: [];
  errors: [];
};

type ConfigUpdateEntry = {
  /**
   * Config default
   */
  default: any;
  action?: "ADD" | "REMOVE";
};

type ConfigUpdateChangeSet = { [k: string]: ConfigUpdateEntry };

export type SettingsUpgradeOpts = {
  force?: boolean;
};

const _SETTINGS: ConfigUpdateChangeSet = {
  "dendron.rootDir": {
    default: ".",
  },
  "editor.minimap.enabled": {
    default: false,
  },
  //"dendron.rootDir": opts.rootDir,
  "files.autoSave": {
    default: "onFocusChange",
  },
  "workbench.colorTheme": { default: "GitHub Light" },
  // "workbench.colorTheme": { default: "Kimbie Dark" },
  // --- images
  "pasteImage.path": { default: "${currentFileDir}/assets/images" },
  // required for jekyll image build
  "pasteImage.prefix": { default: "/" },
  // -- md notes
  // prevent markdown-notes from mangling file names
  "markdown-preview-enhanced.enableWikiLinkSyntax": { default: true },
  "markdown-preview-enhanced.wikiLinkFileExtension": { default: ".md" },
  "vscodeMarkdownNotes.noteCompletionConvention": { default: "noExtension" },
  "vscodeMarkdownNotes.slugifyCharacter": { default: "NONE" },
  // --- snippets
  // add snippet completion
  "editor.snippetSuggestions": { default: "inline" },
  "editor.suggest.snippetsPreventQuickSuggestions": { default: false },
  "editor.suggest.showSnippets": { default: true },
  "editor.tabCompletion": { default: "on" },
};

const _EXTENSIONS: ConfigUpdateEntry[] = [
  { default: "dendron.dendron-paste-image" },
  { default: "equinusocio.vsc-material-theme" },
  { default: "dendron.dendron-markdown-shortcuts" },
  { default: "dendron.dendron-markdown-preview-enhanced" },
  { default: "dendron.dendron-markdown-links" },
  { default: "dendron.dendron-markdown-notes" },
  { default: "github.github-vscode-theme" },
  { default: "shd101wyy.markdown-preview-enhanced", action: "REMOVE" },
  { default: "kortina.vscode-markdown-notes", action: "REMOVE" },
  { default: "mushan.vscode-paste-image", action: "REMOVE" },
];

export type WriteConfigOpts = {
  rootVault?: string;
};

export class WorkspaceConfig {
  static write(wsRoot: string, opts?: WriteConfigOpts) {
    const cleanOpts = _.defaults(opts, {
      rootVault: "vault",
    });
    const jsonBody = {
      folders: [
        {
          path: cleanOpts.rootVault,
        },
      ],
      settings: Settings.defaults(),
      extensions: Extensions.defaults(),
    };
    return fs.writeJSONSync(
      path.join(wsRoot, DendronWorkspace.DENDRON_WORKSPACE_FILE),
      jsonBody,
      { spaces: 4 }
    );
  }

  static async update(_wsRoot: string): Promise<Required<CodeConfig>> {
    const ctx = "WorkspaceConfig:update";
    const src = DendronWorkspace.configuration();
    const changes = await Settings.upgrade(src, _SETTINGS);
    const vault = (DendronWorkspace.workspaceFolders() as WorkspaceFolder[])[0];
    const vscodeDir = path.join(vault.uri.fsPath, ".vscode");
    const snippetChanges = Snippets.upgradeOrCreate(vscodeDir);
    Logger.info({ ctx, vscodeDir, snippetChanges });
    return {
      extensions: {},
      settings: changes,
      snippetChanges,
    };
  }
}

export class Extensions {
  static EXTENSION_FILE_NAME = "extensions.json";

  static defaults(): CodeExtensionsConfig {
    const recommendations = Extensions.configEntries()
      .filter((ent) => {
        return _.isUndefined(ent.action) || ent?.action !== "REMOVE";
      })
      .map((ent) => ent.default);
    const unwantedRecommendations = Extensions.configEntries()
      .filter((ent) => {
        return ent?.action === "REMOVE";
      })
      .map((ent) => ent.default);
    return {
      recommendations,
      unwantedRecommendations,
    };
  }

  static getVSCodeExtnsion() {
    return _.filter(Extensions.configEntries(), (ent) => {
      return _.isUndefined(ent.action);
    }).map((ent) => {
      return {
        id: ent.default,
        extension: extensions.getExtension(ent.default),
      };
    });
  }

  static configEntries(): ConfigUpdateEntry[] {
    return _EXTENSIONS;
  }

  static update(extensions: CodeExtensionsConfig): CodeExtensionsConfig {
    const recommendations: Set<string> = new Set(extensions.recommendations);
    const unwantedRecommendations: Set<string> = new Set(
      extensions.unwantedRecommendations
    );
    const configEntries = Extensions.configEntries();
    configEntries.forEach((ent) => {
      if (ent?.action === "REMOVE") {
        recommendations.delete(ent.default);
        unwantedRecommendations.add(ent.default);
      } else {
        recommendations.add(ent.default);
        unwantedRecommendations.delete(ent.default);
      }
    });
    return {
      recommendations: Array.from(recommendations),
      unwantedRecommendations: Array.from(unwantedRecommendations),
    };
  }
}

type Snippet = {
  prefix: string;
  scope: string;
  body: string | string[];
  description: string;
};

export class Snippets {
  static filename = "dendron.code-snippets";
  static defaults: { [key: string]: Snippet } = {
    todo: {
      prefix: "to",
      scope: "markdown,yaml",
      body: "- [ ] ",
      description: "render todo box",
    },
    tag: {
      prefix: "#",
      scope: "markdown,yaml",
      body: "[[#${1:my-tag}|tag.${1}]]",
      description: "tag",
    },
    date: {
      prefix: "date",
      scope: "markdown,yaml",
      body: "$CURRENT_YEAR.$CURRENT_MONTH.$CURRENT_DATE",
      description: "today's date",
    },
    time: {
      prefix: "time",
      scope: "markdown,yaml",
      body:
        "$CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE $CURRENT_HOUR:$CURRENT_MINUTE",
      description: "time",
    },
  };

  static create = (dirPath: string) => {
    fs.ensureDirSync(dirPath);
    const snippetPath = path.join(dirPath, Snippets.filename);
    return fs.writeJSONSync(snippetPath, Snippets.defaults, { spaces: 4 });
  };

  static read = (dirPath: string): false | { [key: string]: Snippet } => {
    const snippetPath = path.join(dirPath, Snippets.filename);
    if (!fs.existsSync(snippetPath)) {
      return false;
    } else {
      return readJSONWithComments(snippetPath);
    }
  };

  static upgradeOrCreate(dirPath: string): { [key: string]: Snippet } {
    const out = Snippets.read(dirPath);
    if (!out) {
      Snippets.create(dirPath);
      return Snippets.defaults;
    } else {
      const changed: { [key: string]: Snippet } = {};
      const prefixKey = _.mapKeys(out, (ent) => ent.prefix);
      _.each(Snippets.defaults, (v: Snippet, k: string) => {
        if (!_.has(out, k) && !_.has(prefixKey, v.prefix)) {
          changed[k] = v;
        }
      });
      Snippets.write(dirPath, out, changed);
      return changed;
    }
  }

  static write(
    dirPath: string,
    orig: { [key: string]: Snippet },
    changed: { [key: string]: Snippet }
  ) {
    const snippetPath = path.join(dirPath, Snippets.filename);
    const snippets = assignJSONWithComment(orig, changed);
    return writeJSONWithComments(snippetPath, snippets);
  }
}

export class Settings {
  private static getDefaults() {
    return _.mapValues(_SETTINGS, (obj) => {
      return obj.default;
    });
  }

  static configEntries(): ConfigUpdateChangeSet {
    return _SETTINGS;
  }

  static defaults() {
    return { ...Settings.getDefaults() };
  }

  static defaultsChangeSet() {
    return _SETTINGS;
  }

  /**
   * Upgrade config
   * @param config config to upgrade
   * @param target: config set to upgrade to
   */
  static async upgrade(
    src: WorkspaceConfiguration,
    target: ConfigUpdateChangeSet,
    opts?: SettingsUpgradeOpts
  ): Promise<ConfigChanges> {
    const cleanOpts = _.defaults(opts, { force: false });
    const add: any = {};
    const errors: any = {};
    await Promise.all(
      _.map(
        _.omit(target, ["workbench.colorTheme", "[markdown]"]),
        async (entry, key) => {
          const item = src.inspect(key);
          if (
            _.every(
              [
                item?.globalValue,
                item?.workspaceFolderValue,
                item?.workspaceValue,
              ],
              _.isUndefined
            ) ||
            cleanOpts.force
          ) {
            const value = entry.default;
            try {
              src.update(key, value, ConfigurationTarget.Workspace);
              add[key] = value;
              return;
            } catch (err) {
              errors[key] = err;
            }
          }
          return;
        }
      )
    );
    return { add, errors };
  }
}
