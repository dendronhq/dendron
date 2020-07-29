import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ConfigurationTarget, WorkspaceConfiguration } from "vscode";
import { DendronWorkspace } from "./workspace";

type CodeConfig = {
  settings?: CodeSettingsConfig;
  extensions?: CodeExtensionsConfig;
};
type CodeExtensionsConfig = {
  recommendations?: string[];
  unwantedRecommendations?: string[];
};

type CodeSettingsConfig = {
  [p: string]: any;
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
  "materialTheme.accent": { default: "Red" },
  "workbench.colorTheme": { default: "Material Theme High Contrast" },
  "pasteImage.path": { default: "${currentFileDir}/assets/images" },
  // prevent markdown-notes from mangling file names
  "markdown-preview-enhanced.enableWikiLinkSyntax": { default: true },
  "markdown-preview-enhanced.wikiLinkFileExtension": { default: ".md" },
  "vscodeMarkdownNotes.noteCompletionConvention": { default: "noExtension" },
  "vscodeMarkdownNotes.slugifyCharacter": { default: "NONE" },
};

const _EXTENSIONS: ConfigUpdateEntry[] = [
  { default: "mushan.vscode-paste-image" },
  { default: "equinusocio.vsc-material-theme" },
  { default: "dendron.dendron-markdown-shortcuts" },
  { default: "dendron.dendron-markdown-preview-enhanced" },
  { default: "dendron.dendron-markdown-links" },
  { default: "dendron.dendron-markdown-notes" },
  { default: "shd101wyy.markdown-preview-enhanced", action: "REMOVE" },
  { default: "kortina.vscode-markdown-notes", action: "REMOVE" },
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

  static update(wsRoot: string): Required<CodeConfig> {
    const config: CodeConfig = fs.readJSONSync(
      path.join(wsRoot, DendronWorkspace.DENDRON_WORKSPACE_FILE)
    );
    config.extensions = Extensions.update(config.extensions || {});
    config.settings = Settings.update(config.settings || {});

    fs.writeJSONSync(
      path.join(wsRoot, DendronWorkspace.DENDRON_WORKSPACE_FILE),
      config,
      { spaces: 4 }
    );
    return {
      extensions: config.extensions,
      settings: config.settings,
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

  static update(settings: CodeSettingsConfig): CodeSettingsConfig {
    const configEntries = Settings.configEntries();
    _.forEach(configEntries, (changeSet, key) => {
      const cleanChangeSet = _.defaults(changeSet, { action: "ADD" });
      if (cleanChangeSet.action === "ADD") {
        if (!_.has(settings, key)) {
          settings[key] = changeSet.default;
        }
      }
      if (cleanChangeSet.action === "REMOVE") {
        // TODO: right now, not removing
      }
    });
    return settings;
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
      _.map(target, async (entry, key) => {
        if (
          _.isUndefined(src.inspect(key)?.workspaceValue) ||
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
      })
    );
    return { add, errors };
  }
}
