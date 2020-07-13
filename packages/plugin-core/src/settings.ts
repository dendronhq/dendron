import _ from "lodash";
import { WorkspaceConfiguration, ConfigurationTarget } from "vscode";

type ConfigUpdateEntry = {
  /**
   * Config default
   */
  default: any
}

type ConfigUpdateChangeSet = {[k: string]: ConfigUpdateEntry}


const _SETTINGS: ConfigUpdateChangeSet = {
  "spellright.language": {
    default: ["en"],
  },
  "spellright.documentTypes": {
    default: ["markdown", "latex", "plaintext"],
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
  "markdown-preview-enhanced.wikiLinkFileExtension": { default: ".md"}
};

export class Settings {
  private static getDefaults() {
    return _.mapValues(_SETTINGS, (obj) => {
      return obj.default;
    });
  }


  static defaults(opts: { rootDir: string }) {
    return { ...Settings.getDefaults(), "dendron.rootDir": opts.rootDir };
  }

  static defaultsChangeSet() {
    return _SETTINGS
  }

  /**
   * Upgrade config
   * @param config config to upgrade
   * @param target: config set to upgrade to
   */
  static async upgrade(src: WorkspaceConfiguration, target: ConfigUpdateChangeSet) {
    const add: any = {};
    const errors: any = {};
    await Promise.all(_.map(target, async (entry, key) => {
      if (_.isUndefined(src.inspect(key)?.workspaceValue)) {
        const value = entry.default;
        try {
          src.update(key, value, ConfigurationTarget.Global);
          add[key] = value;
          return
        } catch(err) {
          errors[key] = err;
        }
      }
      return;
    }));
    return {add, errors}
  }
}
