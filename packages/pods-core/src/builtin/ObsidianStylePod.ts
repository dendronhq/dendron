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
import css, { Declaration, Comment } from "css";
import moment from "moment";
import path from "path";
import os from "os";
import graphCSS from "../graph";

const ID = "dendron.obsidian-graph-style";

export type ObsidianStyleImportPodPlantOpts = ImportPodPlantOpts & {
  /**
   * Where to output the parsed styles to
   */
  dest: string;
};

class GraphStyleUtils {
  constructor(file: Buffer) {
    file.toString();
  }

  static folderPath() {
    return path.join(os.homedir(), ".dendron", "styles");
  }

  static _getCSSDeclarations = (decs: (Comment | Declaration)[]) => {
    const camel = (str: string) =>
      str.replace(/(-[a-z])/g, (x) => x.toUpperCase()).replace(/-/g, "");

    const parsePx = (val: string) =>
      /px$/.test(val) ? parseFloat(val.replace(/px$/, "")) : val;

    const parsedDecs = decs.filter(
      (d) => d.type === "declaration"
    ) as Declaration[];

    const declarations = parsedDecs
      .map((d) => ({
        key: camel(d.property || ""),
        value: parsePx(d.value || ""),
      }))
      .reduce(
        (
          a: {
            [key: string]: string | number;
          },
          b
        ) => {
          a[b.key] = b.value;
          return a;
        },
        {}
      );

    return declarations;
  };

  static parseObsidianStyles(cssText: string) {
    const styleObject = css.parse(cssText);

    // if (!styleObject) return {};
    if (!styleObject.stylesheet) return {};
    if (!styleObject.stylesheet.rules) return {};

    // const result: {
    //   [key: string]: object;
    // } = {};

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

    rules.forEach((rule: css.Rule, index) => {
      if (_.isUndefined(rule.declarations) || _.isUndefined(rule.selectors))
        return;

      const matchingCSS = graphCSS.find((css) =>
        rule.selectors?.includes(css.obsidian.selector)
      );

      if (matchingCSS) {
        rule.selectors = [matchingCSS.dendron.selector];

        const declarationIndex = rule.declarations.findIndex(
          (declaration) =>
            declaration.type === "declaration" &&
            (declaration as Declaration).property ===
              matchingCSS.obsidian.property
        );

        if (declarationIndex >= 0) {
          (rule.declarations[declarationIndex] as Declaration).property = matchingCSS.dendron.property
        }

        rules[index] = rule;
      }
    });

    styles.stylesheet.rules = rules;

    return css.stringify(styles);
  }

  static async writeDendronStyles(styles: object) {
    const dateString = moment().format("YYYY-MM-DD-hh-mm-ss");
    const filename = `import_${dateString}.css`;
    const folderPath = GraphStyleUtils.folderPath();
    const filePath = path.join(folderPath, filename);

    const cssText = GraphStyleUtils._obsidianToDendronStyleString(styles);

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
      required: ["dest"],
      properties: {
        dest: {
          type: "string",
          description: "Output destination for parsed style file",
        },
      },
    }) as JSONSchemaType<ImportPodConfig>;
  }

  async plant(opts: ObsidianStyleImportPodPlantOpts) {
    const ctx = "ObsidianStylePod";
    this.L.info({ ctx, opts, msg: "enter" });
    const { src } = opts;

    const file = fs.readFileSync(src.fsPath);
    const styles = GraphStyleUtils.parseObsidianStyles(file.toString());

    await GraphStyleUtils.writeDendronStyles(styles);

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
//     }) as ObsidianStyleSchemaType<ExportPodConfig>;
//   }

//   async plant(opts: ExportPodPlantOpts) {
//     const { dest, notes } = opts;

//     // verify dest exist
//     const podDstPath = dest.fsPath;
//     fs.ensureDirSync(path.dirname(podDstPath));

//     return { notes };
//   }
// }
