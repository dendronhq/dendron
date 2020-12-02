import { CONSTANTS, DendronConfig, DVault } from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";
import simpleGit, { SimpleGit } from "simple-git";
import { readYAML } from "./files";
import { vault2Path } from "./filesv2";
export { simpleGit, SimpleGit };

// comment
export class GitUtils {
  static getRepoNameFromURL(url: string): string {
    return path.basename(url, ".git");
  }

  static getVaultsFromRepo(opts: {
    repoPath: string;
    wsRoot: string;
  }): { vaults: DVault[] } {
    const { repoPath, wsRoot } = opts;
    // is workspace root
    if (fs.existsSync(path.join(repoPath, CONSTANTS.DENDRON_CONFIG_FILE))) {
      const config = readYAML(
        path.join(repoPath, CONSTANTS.DENDRON_CONFIG_FILE)
      ) as DendronConfig;
      const vaults = config.vaults.map((ent) => {
        const vpath = vault2Path({ vault: ent, wsRoot: repoPath });
        return {
          ...ent,
          fsPath: path.relative(wsRoot, vpath),
        };
      });
      return {
        vaults,
      };
    } else {
      return { vaults: [{ fsPath: path.resolve(wsRoot, repoPath) }] };
    }
  }
}
