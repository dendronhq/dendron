import _ from "lodash";
import path from "path";
import { CONSTANTS } from "./constants";
import { DVault } from "./typesv2";
import { VaultUtils } from "./vault";

function getRepoNameFromURL(url: string): string {
  return path.basename(url, ".git");
}

export class WorkspaceUtilsCommon {
  static getRepoDir(wsRoot: string) {
    return path.join(wsRoot, CONSTANTS.DENDRON_REPO_DIR);
  }

  static getPathForVault(opts: { vault: DVault; wsRoot: string }) {
    const { wsRoot, vault } = opts;
    if (!_.isUndefined(opts.vault.remote)) {
      const repoName = getRepoNameFromURL(opts.vault.remote.url);
      return path.join(wsRoot, CONSTANTS.DENDRON_REPO_DIR, repoName);
    } else {
      return path.join(wsRoot, VaultUtils.normVaultPath({ vault, wsRoot }));
    }
  }
}
