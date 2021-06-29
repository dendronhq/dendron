import { readYAML } from "@dendronhq/common-server";
import fs, { ensureDirSync, writeFileSync } from "fs-extra";
import _ from "lodash";
import path from "path";
import { PodClassEntryV4, PodItemV4 } from "./types";
export * from "./builtin";
export * from "./types";
export * from "./utils";

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
    let config;
    if (podClass.kind === "export") {
      const required = pod.config.required;
      const podConfig = pod.config.properties;
      config = Object.keys(podConfig)
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
    } else {
      config = pod.config
        .map((ent: any) => {
          ent = _.defaults(ent, { default: "TODO" });
          const args = [
            `# description: ${ent.description}`,
            `# type: ${ent.type}`,
          ];
          let configPrefix = "# ";
          if (ent.required) {
            args.push(`# required: true`);
            configPrefix = "";
          }
          args.push(`${configPrefix}${ent.key}: ${ent.default}`);
          return args.join("\n");
        })
        .join("\n\n");
    }

    if (!fs.existsSync(podConfigPath) || force) {
      writeFileSync(podConfigPath, config);
    }
    return podConfigPath;
  }

  static hasRequiredOpts(_pClassEntry: PodClassEntryV4): boolean {
    // TODO:
    return false;
  }
}
