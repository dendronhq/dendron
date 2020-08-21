import { DendronConfig } from "@dendronhq/common-all";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";

const DENDRON_CONFIG_FILE = "dendron.yml";

export class DConfig {
  static configPath(wsRoot: string): string {
    return path.join(wsRoot, DENDRON_CONFIG_FILE);
  }

  static genDefaultConfig(): DendronConfig {
    return {
      site: {
        siteHierarchies: ["root"],
        siteRootDir: "docs",
      },
    };
  }

  static getOrCreate(dendronRoot: string): DendronConfig {
    const configPath = DConfig.configPath(dendronRoot);
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
