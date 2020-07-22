import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ConfigurationTarget, WorkspaceConfiguration } from "vscode";
import { DendronWorkspace } from "./workspace";

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
  "pasteImage.path": { default: "${currentFileDir}/assets" },
  // prevent markdown-notes from mangling file names
  "vscodeMarkdownNotes.slugifyCharacter": { default: "NONE" },
  "markdown-preview-enhanced.enableWikiLinkSyntax": { default: true },
  "markdown-preview-enhanced.wikiLinkFileExtension": { default: ".md" },
};

const _EXTENSIONS: ConfigUpdateEntry[] = [
  { default: "mushan.vscode-paste-image" },
  { default: "equinusocio.vsc-material-theme" },
  { default: "dendron.dendron-markdown-shortcuts" },
  { default: "dendron.dendron-markdown-preview-enhanced" },
  { default: "dendron.dendron-markdown-links" },
  { default: "dendron.dendron-vscode-markdown-notes" },
  { default: "shd101wyy.markdown-preview-enhanced", action: "REMOVE" },
  { default: "kortina.vscode-markdown-notes", action: "REMOVE" },
];

export type WriteConfigOpts = {
  rootVault?: string;
};

export class WorkspaceConfig {

  static write(wsRoot: string, opts?: WriteConfigOpts) {
    const cleanOpts = _.defaults(opts, {
      rootVault: "vault.main",
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

  static update(wsRoot: string, opts: { rootVault?: string }) {
    const cleanOpts = _.defaults(opts, {
      rootVault: "vault.main",
    });
    const jsonBody = {
      folders: [
        {
          path: cleanOpts.rootVault,
        },
      ],
      settings: Settings.defaults(),
      extensions: {
        ...Extensions.defaults(),
      },
    };
    return fs.writeJSONSync(
      path.join(wsRoot, DendronWorkspace.DENDRON_WORKSPACE_FILE),
      jsonBody,
      { spaces: 4 }
    );
  }
}

// interface WorkspaceSection {
//   getDefaults()

// }

export class Extensions {
  static EXTENSION_FILE_NAME = "extensions.json";

  static defaults(): {
    recommendations: string[];
    unwantedRecommendations: string[];
  } {
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

  /**
   * Initialize empty extension object or read from file
   * @param wsRoot
   */
  static _getExtensions(wsRoot: string): string[] {
    const extensionsPath = path.join(
      wsRoot,
      ".vscode",
      Extensions.EXTENSION_FILE_NAME
    );
    const out = fs.existsSync(extensionsPath)
      ? fs.readJSONSync(extensionsPath)["recommendations"] || []
      : [];
    return out;
  }

  static _writeExtensions(wsRoot: string, extensions: string[]) {
    const extensionsFolder = path.join(wsRoot, ".vscode");
    fs.ensureDirSync(extensionsFolder);
    return fs.writeJSONSync(
      path.join(extensionsFolder, Extensions.EXTENSION_FILE_NAME),
      {
        recommendations: extensions,
      },
      { spaces: 4 }
    );
  }

  static update(wsRoot: string) {
    const extensions = Extensions._getExtensions(wsRoot);
    const recommendations: Set<string> = new Set(extensions);
    const defaults = Extensions.configEntries();
    defaults.forEach((ent) => {
      if (ent?.action === "REMOVE") {
        recommendations.delete(ent.default);
      } else {
        recommendations.add(ent.default);
      }
    });
    Extensions._writeExtensions(wsRoot, Array.from(recommendations));
  }

  static write(vscodeFolderPath: string) {
    const out: {
      recommendations: string[];
    } = {
      recommendations: [],
    };
    const defaults = Extensions.configEntries();
    defaults.forEach((ent) => {
      if (!ent.action || ent.action != "REMOVE") {
        out.recommendations.push(ent.default);
      }
    });
    return fs.writeJSONSync(
      path.join(vscodeFolderPath, Extensions.EXTENSION_FILE_NAME),
      out,
      { spaces: 4 }
    );
  }
}

export class Settings {
  private static getDefaults() {
    return _.mapValues(_SETTINGS, (obj) => {
      return obj.default;
    });
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
