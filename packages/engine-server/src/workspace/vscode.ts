import {
  CONSTANTS,
  DVault,
  WorkspaceExtensionSetting,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import {
  assignJSONWithComment,
  readJSONWithComments,
  writeJSONWithCommentsSync,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export type CodeConfigChanges = {
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

export type ConfigUpdateChangeSet = { [k: string]: ConfigUpdateEntry };

export type SettingsUpgradeOpts = {
  force?: boolean;
};

export const _SETTINGS: ConfigUpdateChangeSet = {
  "dendron.rootDir": {
    default: ".",
  },
  // "editor.minimap.enabled": {
  //   default: false,
  // },
  "files.autoSave": {
    default: "onFocusChange",
  },
  // --- images
  // eslint-disable-next-line no-template-curly-in-string
  "pasteImage.path": { default: "${currentFileDir}/assets/images" },
  // required for jekyll image build
  "pasteImage.prefix": { default: "/" },
  // -- md notes
  // prevent markdown-notes from mangling file names
  "markdown-preview-enhanced.enableWikiLinkSyntax": { default: true },
  "markdown-preview-enhanced.wikiLinkFileExtension": { default: ".md" },
  // --- snippets
  // add snippet completion
  "editor.snippetSuggestions": { default: "inline" },
  "editor.suggest.snippetsPreventQuickSuggestions": { default: false },
  "editor.suggest.showSnippets": { default: true },
  "editor.tabCompletion": { default: "on" },
};

const _EXTENSIONS: ConfigUpdateEntry[] = [
  { default: "dendron.dendron" },
  { default: "dendron.dendron-paste-image" },
  { default: "dendron.dendron-markdown-shortcuts" },
  // Autocomplete & warnings when editing `dendron.yml`
  { default: "redhat.vscode-yaml" },
  { default: "dendron.dendron-markdown-links", action: "REMOVE" },
  { default: "dendron.dendron-markdown-notes", action: "REMOVE" },
  { default: "dendron.dendron-markdown-preview-enhanced", action: "REMOVE" },
  { default: "shd101wyy.markdown-preview-enhanced", action: "REMOVE" },
  { default: "kortina.vscode-markdown-notes", action: "REMOVE" },
  { default: "mushan.vscode-paste-image", action: "REMOVE" },
];

export type WriteConfigOpts = {
  vaults?: DVault[];
  overrides?: Partial<WorkspaceSettings>;
};

export class WorkspaceConfig {
  static genDefaults(): WorkspaceSettings {
    return {
      folders: [],
      settings: Settings.defaults(),
      extensions: Extensions.defaults(),
    };
  }

  static workspaceFile(wsRoot: string) {
    return path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME);
  }

  /**
   * Create dendron.code-workspace file
   * @param wsRoot
   * @param vaults
   * @param opts
   * @returns
   */
  static write(wsRoot: string, vaults?: DVault[], opts?: WriteConfigOpts) {
    const cleanOpts = _.defaults(opts, {
      vaults,
      overrides: {},
    });
    const defaultSettings = this.genDefaults();
    const jsonBody: WorkspaceSettings = _.merge(
      defaultSettings,
      {
        folders: cleanOpts.vaults
          ? cleanOpts.vaults.map((ent) => ({
              path: ent.fsPath,
              name: ent.name,
            }))
          : [],
      },
      cleanOpts.overrides
    );
    return fs.writeJSONSync(WorkspaceConfig.workspaceFile(wsRoot), jsonBody, {
      spaces: 2,
    });
  }
}

export class Extensions {
  static EXTENSION_FILE_NAME = "extensions.json";

  static defaults(): WorkspaceExtensionSetting {
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
    date: {
      prefix: "date",
      scope: "markdown,yaml",
      body: "$CURRENT_YEAR.$CURRENT_MONTH.$CURRENT_DATE",
      description: "today's date",
    },
    time: {
      prefix: "time",
      scope: "markdown,yaml",
      body: "$CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE $CURRENT_HOUR:$CURRENT_MINUTE",
      description: "time",
    },
  };

  static create = (dirPath: string) => {
    fs.ensureDirSync(dirPath);
    const snippetPath = path.join(dirPath, Snippets.filename);
    return fs.writeJSONSync(snippetPath, Snippets.defaults, { spaces: 4 });
  };

  static read = async (
    dirPath: string
  ): Promise<false | { [key: string]: Snippet }> => {
    const snippetPath = path.join(dirPath, Snippets.filename);
    if (!fs.existsSync(snippetPath)) {
      return false;
    } else {
      return readJSONWithComments(snippetPath) as unknown as any;
    }
  };

  static async upgradeOrCreate(
    dirPath: string
  ): Promise<{ [key: string]: Snippet }> {
    const out = await Snippets.read(dirPath);
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
      await Snippets.write(dirPath, out, changed);
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
    return writeJSONWithCommentsSync(snippetPath, snippets);
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
}
