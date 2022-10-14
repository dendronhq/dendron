/* eslint-disable */
import {
  CONSTANTS,
  DendronConfig,
  DendronPublishingConfig,
  Time,
} from "@dendronhq/common-all";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export class DConfig {
  static configPath(configRoot: string): string {
    return path.join(configRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  }

  /**
   * Get without filling in defaults ^getRaw
   * @param wsRoot
   */
  static getRaw(wsRoot: string) {
    const configPath = DConfig.configPath(wsRoot);
    const config = readYAML(configPath) as Partial<DendronConfig>;
    return config;
  }

  static getSiteIndex(sconfig: DendronPublishingConfig) {
    let { siteIndex, siteHierarchies } = sconfig;
    return siteIndex || siteHierarchies[0];
  }

  static writeConfig({
    wsRoot,
    config,
  }: {
    wsRoot: string;
    config: DendronConfig;
  }) {
    const configPath = DConfig.configPath(wsRoot);
    return writeYAML(configPath, config);
  }

  /**
   * Create a backup of dendron.yml with an optional custom infix string. ^iRXV8AFm3hSJ
   * e.g.) createBackup(wsRoot, "foo") will result in a backup file name ^VwEHhuhP4bbK
   * `dendron.yyyy.MM.dd.HHmmssS.foo.yml` ^backup-file
   *
   * @param wsRoot workspace root
   * @param infix custom string used in the backup name
   */
  static createBackup(wsRoot: string, infix: string): string {
    const configPath = DConfig.configPath(wsRoot);
    const today = Time.now().toFormat("yyyy.MM.dd.HHmmssS");
    const prefix = `dendron.${today}.`;
    const suffix = `yml`;
    const maybeInfix = infix ? `${infix}.` : "";
    const backupName = `${prefix}${maybeInfix}${suffix}`;
    const backupPath = path.join(wsRoot, backupName);
    fs.copyFileSync(configPath, backupPath);
    return backupPath;
  }
}
