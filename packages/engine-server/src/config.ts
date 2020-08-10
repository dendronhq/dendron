import { DendronConfig } from "@dendronhq/common-all";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";

const DENDRON_CONFIG_FILE = "dendron.yml";

export class DConfig {
  static genDefaultConfig(): DendronConfig {
    return {
      site: {
        noteRoot: "root",
        siteRoot: "docs",
      },
    };
  }

  static getOrCreate(dendronRoot: string): DendronConfig {
    const configPath = path.join(dendronRoot, DENDRON_CONFIG_FILE);
    let config: DendronConfig;
    if (!fs.existsSync(configPath)) {
      config = DConfig.genDefaultConfig();
      writeYAML(configPath, config);
    } else {
      config = readYAML(configPath) as DendronConfig;
    }
    return config;
  }
}
