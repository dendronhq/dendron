import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ConfigurationTarget, WorkspaceConfiguration } from "vscode";

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
  { default: "kortina.vscode-markdown-notes" },
  { default: "equinusocio.vsc-material-theme" },
  { default: "dendron.dendron-markdown-shortcuts" },
  { default: "dendron.dendron-markdown-preview-enhanced" },
  { default: "dendron.dendron-markdown-links" },
  { default: "shd101wyy.markdown-preview-enhanced", action: "REMOVE" },
];

// interface WorkspaceSection {
//   getDefaults()

// }

export class Extensions {
  static EXTENSION_FILE_NAME = "extensions.json";

  static defaults(): ConfigUpdateEntry[] {
    return _EXTENSIONS;
  }

  /**
   * Initialize empty extension object or read from file
   * @param wsRoot
   */
  static _getExtensions(
    wsRoot: string
  ): string[] {
    const extensionsPath = path.join(
      wsRoot,
      ".vscode",
      Extensions.EXTENSION_FILE_NAME
    );
    const out = fs.existsSync(extensionsPath)
      ? fs.readJSONSync(extensionsPath)["recommendations"] || []
      : []
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
    const defaults = Extensions.defaults();
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
    const defaults = Extensions.defaults();
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
  ) {
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
