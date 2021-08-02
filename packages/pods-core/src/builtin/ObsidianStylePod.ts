import fs from "fs-extra";
import _ from "lodash";
// import path from "path";
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
import { parse, Rule, Declaration, Comment } from "css";

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
    const styleObject = parse(cssText);
    if (!styleObject.stylesheet) return {};
    if (!styleObject.stylesheet.rules) return {};

    const result: {
      [key: string]: object;
    } = {};

    styleObject.stylesheet.rules.forEach((untypedRule) => {
      if (untypedRule.type === "comment") return;
      const rule = untypedRule as Rule;

      if (!rule.selectors || !rule.declarations) return;
      const [key] = rule.selectors;

      if (key.length) {
        result[key] = this._getCSSDeclarations(rule.declarations);
      }
    });

    return styleObject.stylesheet.rules;
  }

  static writeDendronStyles(styles: object, dest: string) {}
}

export class ObsidianStyleImportPod extends ImportPod {
  static id: string = ID;
  static description: string = "import obsidian style";

  get config(): JSONSchemaType<ImportPodConfig> {
    return PodUtils.createImportConfig({
      required: ['dest'],
      properties: {
        dest: {
          type: "string",
          description: "Output destination for parsed style file",
        }
      },
    }) as JSONSchemaType<ImportPodConfig>;
  }

  async plant(opts: ObsidianStyleImportPodPlantOpts) {
    const ctx = "ObsidianStylePod";
    this.L.info({ ctx, opts, msg: "enter" });
    const { src } = opts;

    const file = fs.readFileSync(src.fsPath);
    const styles = GraphStyleUtils.parseObsidianStyles(file.toString());

    GraphStyleUtils.writeDendronStyles(styles, "");

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
