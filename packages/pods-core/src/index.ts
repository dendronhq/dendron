import { readYAML } from "@dendronhq/common-server";
import fs, { ensureDirSync, writeFileSync } from "fs-extra";
import _ from "lodash";
import path from "path";
import { JSONExportPod, JSONImportPod, JSONPublishPod } from "./builtin";
import { MarkdownImportPod, MarkdownPublishPod } from "./builtin/MarkdownPod";
import { PodClassEntryV2, PodClassEntryV3 } from "./types";
export * from "./types";
export * from "./utils";
export * from "./builtin";
export * from "./base";

export function getAllExportPods(): PodClassEntryV2[] {
  return [JSONExportPod];
}
export function getAllPublishPods(): PodClassEntryV3[] {
  return [JSONPublishPod, MarkdownPublishPod];
}
export function getAllImportPods(): PodClassEntryV2[] {
  return [MarkdownImportPod, JSONImportPod];
}

// === utils

export function getPodConfigPath(
  podsDir: string,
  podClass: PodClassEntryV2 | PodClassEntryV3
): string {
  return path.join(podsDir, podClass.id, `config.${podClass.kind}.yml`);
}

export function getPodPath(podsDir: string, podClass: PodClassEntryV2): string {
  return path.join(podsDir, podClass.id);
}

export function getPodConfig(
  podsDir: string,
  podClass: PodClassEntryV2 | PodClassEntryV3
): false | any {
  const podConfigPath = getPodConfigPath(podsDir, podClass);
  if (!fs.existsSync(podConfigPath)) {
    return false;
  } else {
    return readYAML(podConfigPath);
  }
}

export function genPodConfigFile(
  podsDir: string,
  podClass: PodClassEntryV2 | PodClassEntryV3
) {
  const podConfigPath = getPodConfigPath(podsDir, podClass);
  ensureDirSync(path.dirname(podConfigPath));
  const config = podClass
    .config()
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

export class PodUtils {
  static hasRequiredOpts(_pClassEntry: PodClassEntryV3): boolean {
    // TODO:
    return false;
  }
}
