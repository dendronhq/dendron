import { CONSTANTS, DendronConfig, DVault } from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";
import simpleGit, { SimpleGit } from "simple-git";
import { readYAML } from "./files";
import { vault2Path } from "./filesv2";
export { simpleGit, SimpleGit };

// comment
export class GitUtils {
  /**
   * Convert a github repo orul to access token format
   */
  static getGithubAccessTokenUrl(opts: {
    remotePath: string;
    accessToken: string;
  }) {
    const { remotePath, accessToken } = opts;
    let repoPath: string;
    debugger;
    if (remotePath.startsWith("https://")) {
      repoPath = remotePath.split("/").slice(-2).join("/");
    } else {
      repoPath = opts.remotePath.split(":").slice(-1)[0];
    }
    return `https://${accessToken}:x-oauth-basic@github.com/${repoPath}`;
  }

  static getOwnerAndRepoFromURL(url: string) {
    const [owner, repo] = url.split("/").slice(-2);
    return { owner, repo };
  }

  static getRepoNameFromURL(url: string): string {
    return path.basename(url, ".git");
  }

  static getVaultFromRepo(opts: {
    repoPath: string;
    repoUrl: string;
    wsRoot: string;
  }): DVault {
    const { repoPath, wsRoot } = opts;
    return {
      fsPath: path.relative(wsRoot, repoPath),
      remote: { type: "git", url: opts.repoUrl },
    };
  }

  static getVaultsFromRepo(opts: {
    repoPath: string;
    repoUrl: string;
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
      return {
        vaults: [
          {
            fsPath: path.relative(wsRoot, repoPath),
            remote: { type: "git", url: opts.repoUrl },
          },
        ],
      };
    }
  }

  static isRepo(src: string) {
    return fs.existsSync(src) && fs.existsSync(path.join(src, ".git"));
  }
}
