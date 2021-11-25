import { readYAML } from "@dendronhq/common-server";
import fs, { ensureDirSync, writeFileSync } from "fs-extra";
import _ from "lodash";
import path from "path";
import { JSONSchemaType } from "..";

export class ConfigFileUtils {
  static getConfigByFPath({ fPath }: { fPath: string }): any {
    if (!fs.existsSync(fPath)) {
      return undefined;
    } else {
      return readYAML(fPath);
    }
  }

  /**
   * Create config file if it doesn't exist
   */
  static genConfigFileV2<T>({
    fPath,
    configSchema,
    force,
    setProperties,
  }: {
    fPath: string;
    configSchema: JSONSchemaType<T>;
    force?: boolean;
    setProperties?: Partial<T>;
  }) {
    ensureDirSync(path.dirname(fPath));
    const required = configSchema.required;
    const podConfig = configSchema.properties;
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

        // If a pre-set value for an optional param has been passed in, then keep it.
        if (setProperties && ent in setProperties) {
          configPrefix = "";
        }

        args.push(
          `${configPrefix}${ent}: ${
            setProperties && ent in setProperties
              ? setProperties[ent as keyof T]
              : podConfig[ent].default
          }`
        );
        return args.join("\n");
      })
      .join("\n\n");

    const fileExists = fs.existsSync(fPath);
    if (!fileExists || force) {
      writeFileSync(fPath, config);
    } else if (fileExists && !force) {
      throw new Error("Config already exists!");
    }
    return fPath;
  }

  static createExportConfig(opts: { required: string[]; properties: any }) {
    return {
      type: "object",
      additionalProperties: false,
      required: ["podId", "podType", ...opts.required],
      properties: {
        podId: {
          description: "configuration ID",
          type: "string",
        },
        description: {
          description: "optional description for the pod",
          type: "string",
          nullable: true,
        },
        exportScope: {
          description: "export scope of the pod",
          type: "string",
          nullable: true,
        },
        podType: {
          description: "type of pod",
          type: "string",
        },
        ...opts.properties,
      },
    };
  }
}
