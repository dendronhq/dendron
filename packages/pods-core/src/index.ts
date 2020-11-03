import { readYAML } from "@dendronhq/common-server";
import fs, { ensureDirSync, writeFileSync } from "fs-extra";
import _ from "lodash";
import path from "path";
import { JSONExportPod, JSONImportPod, JSONPublishPod } from "./builtin";
import { MarkdownImportPod, MarkdownPublishPod } from "./builtin/MarkdownPod";
import { PodClassEntryV4 } from "./types";
export * from "./base";
export * from "./builtin";
export * from "./types";
export * from "./utils";

export function getAllExportPods(): PodClassEntryV4[] {
  return [JSONExportPod];
}
export function getAllPublishPods(): PodClassEntryV4[] {
  return [JSONPublishPod, MarkdownPublishPod];
}
export function getAllImportPods(): PodClassEntryV4[] {
  return [JSONImportPod, MarkdownImportPod];
}

// === utils

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

  static genConfigFile({
    podsDir,
    podClass,
  }: {
    podsDir: string;
    podClass: PodClassEntryV4;
  }) {
    const podConfigPath = PodUtils.getConfigPath({ podsDir, podClass });
    ensureDirSync(path.dirname(podConfigPath));
    const pod = new podClass();
    const config = pod.config
      .map((ent) => {
        ent = _.defaults(ent, { default: "TODO" });
        return [
          `# description: ${ent.description}`,
          `# type: ${ent.type}`,
          `${ent.key}: ${ent.default}`,
        ].join("\n");
      })
      .join("\n");
    if (!fs.existsSync(podConfigPath)) {
      writeFileSync(podConfigPath, config);
    }
    return podConfigPath;
  }

  static hasRequiredOpts(_pClassEntry: PodClassEntryV4): boolean {
    // TODO:
    return false;
  }
}
