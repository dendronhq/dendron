import fs from "fs-extra";
import _ from "lodash";
import {
  // ExportPod,
  // ExportPodPlantOpts,
  // ExportPodConfig,
  ImportPod,
  ImportPodConfig,
  ImportPodPlantOpts,
} from "../basev3";
import { JSONSchemaType } from "ajv";
import { PodUtils } from "../utils";
import css, { Declaration } from "css";
import moment from "moment";
import path from "path";
import os from "os";
import graphCSS from "../graph";
// import { DConfig } from "@dendronhq/engine-server";
// import { readYAML } from "@dendronhq/common-server";
// import { DendronConfig } from "@dendronhq/common-all";

const ID = "dendron.obsidian-graph-style";

export type ObsidianStyleImportPodPlantOpts = ImportPodPlantOpts & {
  /**
   * Where to output the parsed styles to
   */
  dest: string;
};

class GraphStyleUtils {
  static folderPath() {
    return path.join(os.homedir(), ".dendron", "styles");
  }

  static parseStyles(cssText: string) {
    const styleObject = css.parse(cssText);

    if (!styleObject) return {};
    if (!styleObject.stylesheet) return {};
    if (!styleObject.stylesheet.rules) return {};

    styleObject.stylesheet.rules = styleObject.stylesheet.rules.filter(
      (rule) => {
        if (rule.type === "comment") return false;
        return true;
      }
    );

    return styleObject;
  }

  static _obsidianToDendronStyleString(styles: css.Stylesheet) {
    if (!styles) return "";
    if (!styles.stylesheet) return "";
    if (!styles.stylesheet.rules) return "";

    const rules = styles.stylesheet.rules;
    const parsedRules: (css.Comment | css.Rule | css.AtRule)[] = [];

    rules.forEach((rule: css.Rule) => {
      if (_.isUndefined(rule.declarations) || _.isUndefined(rule.selectors))
        return;

      const cssRulesToCheck = graphCSS.filter((cssRule) =>
        rule.selectors?.includes(cssRule.obsidian.selector)
      );

      if (cssRulesToCheck.length > 0) {
        rule.selectors = rule.selectors.reduce(
          (parsedSelectors: string[], selector) => {
            const cssRule = cssRulesToCheck.find(
              (cssRule) => cssRule.obsidian.selector === selector
            );

            if (cssRule) return [...parsedSelectors, cssRule.dendron.selector];
            return parsedSelectors;
          },
          []
        );

        const parsedDeclarations: (css.Comment | css.Declaration)[] = [];
        rule.declarations.forEach((declaration) => {
          if (declaration.type === "comment") {
            parsedDeclarations.push(declaration);
            return;
          }

          const cssRule = cssRulesToCheck.find(
            (cssRule) =>
              (declaration as Declaration).property ===
              cssRule.obsidian.property
          );

          if (cssRule) {
            (declaration as Declaration).property = cssRule.dendron.property;
            parsedDeclarations.push(declaration);
          }
        });
        rule.declarations = parsedDeclarations;
        parsedRules.push(rule);
      }
    });

    styles.stylesheet.rules = parsedRules;

    return css.stringify(styles);
  }

  static _dendronToObsidianStyleString(styles: css.Stylesheet) {
    if (!styles) return "";
    if (!styles.stylesheet) return "";
    if (!styles.stylesheet.rules) return "";

    // TODO: Dendron -> Obsidian export logic
    // const rules = styles.stylesheet.rules;
    // const parsedRules: (css.Comment | css.Rule | css.AtRule)[] = [];

    // rules.forEach((rule: css.Rule) => {
    //   if (_.isUndefined(rule.declarations) || _.isUndefined(rule.selectors))
    //     return;

    //   const cssRulesToCheck = graphCSS.filter((cssRule) =>
    //     rule.selectors?.includes(cssRule.dendron.selector)
    //   );

    //   if (cssRulesToCheck.length > 0) {
    //     const parsedDeclarations: (css.Comment | css.Declaration)[] = [];
    //     rule.declarations.forEach((declaration) => {
    //       if (declaration.type === "comment") {
    //         parsedDeclarations.push(declaration);
    //         return;
    //       }

    //       const cssRule = cssRulesToCheck.find(
    //         (cssRule) =>
    //           (declaration as Declaration).property ===
    //           cssRule.dendron.property
    //       );

    //       if (cssRule) {
    //         (declaration as Declaration).property = cssRule.obsidian.property;
    //         parsedDeclarations.push(declaration);
    //       }
    //     });

    //     rule.selectors = rule.selectors.reduce((parsedSelectors: string[], selector) => {
    //       const cssRule = cssRulesToCheck.find(
    //         (cssRule) => cssRule.dendron.selector === selector && rule.declarations && rule.declarations.filter(dec => dec.type !== 'comment' && (dec as Declaration).property === cssRule.dendron.property).length > 0
    //       );

    //       if (cssRule) return [...parsedSelectors, cssRule.obsidian.selector];
    //       return parsedSelectors;
    //     }, []);

    //     rule.declarations = parsedDeclarations;
    //     parsedRules.push(rule);
    //   }
    // });

    // styles.stylesheet.rules = parsedRules;

    return css.stringify(styles);
  }

  static async writeStyles(
    styles: object,
    type: "import" | "export",
    folderPath: string = GraphStyleUtils.folderPath()
  ) {
    const dateString = moment().format("YYYY-MM-DD-hh-mm-ss");
    const filename = `${type}_${dateString}.css`;
    const filePath = path.join(folderPath, filename);

    const cssText =
      type === "import"
        ? GraphStyleUtils._obsidianToDendronStyleString(styles)
        : GraphStyleUtils._dendronToObsidianStyleString(styles);

    // verify dest exist
    try {
      fs.ensureDirSync(folderPath);
    } catch {
      await fs.promises.mkdir(folderPath, { recursive: true });
    }

    fs.writeFileSync(filePath, cssText);
  }
}

export class ObsidianStyleImportPod extends ImportPod {
  static id: string = ID;
  static description: string = "import obsidian style";

  get config(): JSONSchemaType<ImportPodConfig> {
    return PodUtils.createImportConfig({
      required: [],
      properties: {},
    }) as JSONSchemaType<ImportPodConfig>;
  }

  async plant(opts: ObsidianStyleImportPodPlantOpts) {
    const ctx = "ObsidianStylePod";
    this.L.info({ ctx, opts, msg: "enter" });
    const { src } = opts;

    const file = fs.readFileSync(src.fsPath);
    const styles = GraphStyleUtils.parseStyles(file.toString());

    await GraphStyleUtils.writeStyles(styles, "import");

    return { importedNotes: [] };
  }
}

// export class ObsidianStyleExportPod extends ExportPod {
//   static id: string = ID;
//   static description: string = "export notes as json";

//   get config(): JSONSchemaType<ExportPodConfig> {
//     return PodUtils.createExportConfig({
//       required: [],
//       properties: {},
//     }) as JSONSchemaType<ExportPodConfig>;
//   }

//   async plant(opts: ExportPodPlantOpts) {
//     const { dest, notes, wsRoot } = opts;

//     if (!dest) {
//       throw Error('No output destination specified.')
//     }

//     const configPath = DConfig.configPath(wsRoot);
//     const dendronConfig: DendronConfig = readYAML(configPath)

//     const fileName = dendronConfig.graph?.stylePath || 'graph.css'
//     const filePath = path.join(os.homedir(), ".dendron", "styles", fileName);

//     try {
//       const file = fs.readFileSync(filePath);

//       const styles = GraphStyleUtils.parseStyles(file.toString());

//       await GraphStyleUtils.writeStyles(styles, 'export', dest.fsPath);
//     } catch {
//       throw Error('No style file to export.')
//     }

//     return { notes };
//   }
// }
