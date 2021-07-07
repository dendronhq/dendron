import { readYAML } from "@dendronhq/common-server";
import fs, { ensureDirSync, writeFileSync } from "fs-extra";
import _ from "lodash";
import path from "path";
import { PodClassEntryV4, PodItemV4 } from "./types";
export * from "./builtin";
export * from "./types";
export * from "./utils";
import Ajv, { JSONSchemaType } from "ajv";
const ajv = new Ajv();
import { DendronError } from "@dendronhq/common-all";

export const podClassEntryToPodItemV4 = (p: PodClassEntryV4): PodItemV4 => {
  return {
    id: p.id,
    description: p.description,
    podClass: p,
  };
};

export class PodUtils {
  static getConfig({
    podsDir,
    podClass,
  }: {
    podsDir: string;
    podClass: PodClassEntryV4;
  }): false | any {
    const podConfigPath = PodUtils.getConfigPath({ podsDir, podClass });
    if (!fs.existsSync(podConfigPath)) {
      return false;
    } else {
      return readYAML(podConfigPath);
    }
  }

  static getConfigPath({
    podsDir,
    podClass,
  }: {
    podsDir: string;
    podClass: PodClassEntryV4;
  }): string {
    return path.join(podsDir, podClass.id, `config.${podClass.kind}.yml`);
  }

  static getPath({
    podsDir,
    podClass,
  }: {
    podsDir: string;
    podClass: PodClassEntryV4;
  }): string {
    return path.join(podsDir, podClass.id);
  }

  static getPodDir(opts: { wsRoot: string }) {
    const podsPath = path.join(opts.wsRoot, "pods");
    return podsPath;
  }

  static createExportConfig(opts: { required: string[]; properties: any }) {
    return {
      type: "object",
      additionalProperties: false,
      required: ["dest", ...opts.required],
      properties: {
        dest: {
          type: "string",
          description: "Where to export to",
        },
        includeBody: {
          type: "boolean",
          default: true,
          description: "should body be included",
          nullable: true,
        },
        includeStubs: {
          type: "boolean",
          description: "should stubs be included",
          nullable: true,
        },
        ignore: { type: "array", items: { type: "string" }, nullable: true },
        ...opts.properties,
      },
    };
  }

  static createImportConfig(opts: { required: string[]; properties: any }) {
    return {
      type: "object",
      additionalProperties: false,
      required: ["src", "vaultName", ...opts.required],
      properties: {
        src: {
          type: "string",
          description: "Where to import from",
        },
        vaultName: {
          type: "string",
          description: "name of vault to import into",
        },
        concatenate: {
          type: "boolean",
          description: "whether to concatenate everything into one note",
          nullable: true,
        },
        frontmatter: {
          description: "frontmatter to add to each note",
          type: "object",
          nullable: true,
        },
        fnameAsId: {
          description: "use the file name as the id",
          type: "boolean",
          nullable: true,
        },
        destName: {
          description: "If concatenate is set, name of destination path",
          type: "string",
          nullable: true,
        },
        ...opts.properties,
      },
      if: {
        properties: { concatenate: { const: true } },
      },
      then: {
        dependencies: {
          concatenate: ["destName"],
        },
      },
    };
  }

  static createPublishConfig(opts: { required: string[]; properties: any }) {
    return {
      type: "object",
      additionalProperties: false,
      required: ["vaultName", "fname", ...opts.required],
      properties: {
        fname: {
          description: "name of src file",
          type: "string",
        },
        vaultName: {
          description: "name of src vault",
          type: "string",
        },
        dest: {
          description: "where to export to",
          type: "string",
        },
        ...opts.properties,
      },
    };
  }

  /**
   * Create config file if it doesn't exist
   */
  static genConfigFile({
    podsDir,
    podClass,
    force,
  }: {
    podsDir: string;
    podClass: PodClassEntryV4;
    force?: boolean;
  }) {
    const podConfigPath = PodUtils.getConfigPath({ podsDir, podClass });
    ensureDirSync(path.dirname(podConfigPath));
    const pod = new podClass();
    const required = pod.config.required;
    const podConfig = pod.config.properties;
    const config = Object.keys(podConfig)
      .map((ent: any) => {
        podConfig[ent] = _.defaults(podConfig[ent], { default: "TODO" });
        const args = [
          `# description: ${podConfig[ent].description}`,
          `# type: ${podConfig[ent].type}`,
        ];
        let configPrefix = "# ";
        if (required.includes(`${ent}`)) {
          args.push(`# required: true`);
          configPrefix = "";
        }
        args.push(`${configPrefix}${ent}: ${podConfig[ent].default}`);
        return args.join("\n");
      })
      .join("\n\n");

    if (!fs.existsSync(podConfigPath) || force) {
      writeFileSync(podConfigPath, config);
    }
    return podConfigPath;
  }

  static validate<T>(config: Partial<T>, schema: JSONSchemaType<T>) {
    const validateConfig = ajv.compile(schema);
    const valid = validateConfig(config);
    if (!valid) {
      const errors = ajv.errorsText(validateConfig.errors);
      throw new DendronError({
        message: `validation errors: ${errors}`,
        payload: `error: ${errors}`,
      });
    }
  }

  static hasRequiredOpts(_pClassEntry: PodClassEntryV4): boolean {
    // TODO:
    return false;
  }
}
