import { readYAML } from "@dendronhq/common-server";
import fs, { writeFileSync, ensureDirSync } from "fs-extra";
import path from "path";
import { PodOptsV2, Pod } from "./base";
import { JSONExportPod, PodConfigEntry } from "./builtin";
import _ from "lodash";

export interface PodClassEntryV2 {
  id: string;
  description: string;
  config: () => PodConfigEntry[];
  new (opts: PodOptsV2): Pod;
}

export function getAllExportPods(): PodClassEntryV2[] {
  return [JSONExportPod];
}

// === utils

export function getPodConfigPath(
  podsDir: string,
  podClass: PodClassEntryV2
): string {
  return path.join(podsDir, podClass.id, "config.yml");
}

export function getPodPath(podsDir: string, podClass: PodClassEntryV2): string {
  return path.join(podsDir, podClass.id);
}

export function getPodConfig(
  podsDir: string,
  podClass: PodClassEntryV2
): false | any {
  const podConfigPath = getPodConfigPath(podsDir, podClass);
  if (!fs.existsSync(podConfigPath)) {
    return false;
  } else {
    return readYAML(podConfigPath);
  }
}

export function genPodConfig(podsDir: string, podClass: PodClassEntryV2) {
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
