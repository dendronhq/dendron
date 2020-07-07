import _ from "lodash";

const _SETTINGS = {
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
}
