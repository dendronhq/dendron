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
    const config = pod.config
      .map((ent) => {
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
        return args.join("\n\n");
      })
      .join("\n");
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
