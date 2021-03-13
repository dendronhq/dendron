import {
  CONSTANTS,
  DendronConfig,
  DVault,
  NotePropsV2,
  RESERVED_KEYS,
  VaultUtils,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import simpleGit, { SimpleGit } from "simple-git";
import { readYAML } from "./files";
import { vault2Path } from "./filesv2";
export { simpleGit, SimpleGit };

const formatString = (opts: { txt: string; note: NotePropsV2 }) => {
  const { txt, note } = opts;
  _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
  const noteHiearchy = note.fname.replace(/\./g, "/");
  return _.template(txt)({ noteHiearchy });
};

// comment
export class GitUtils {
  static canShowGitLink(opts: { config: DendronConfig; note: NotePropsV2 }) {
    const { config, note } = opts;

    if (
      _.isBoolean((note.custom || {})[RESERVED_KEYS.GIT_NO_LINK]) &&
      note.custom[RESERVED_KEYS.GIT_NO_LINK]
    ) {
      return false;
    }
    return _.every([
      config.site.gh_edit_link,
      config.site.gh_edit_link_text,
      config.site.gh_edit_repository,
      config.site.gh_edit_branch,
      config.site.gh_edit_view_mode,
    ]);
  }
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

  static git2Github(gitUrl: string) {
    // 'git@github.com:kevinslin/dendron-vault.git'
    // @ts-ignore
    const [_, userAndRepo] = gitUrl.split(":");
    const [user, repo] = userAndRepo.split("/");
    return `https://github.com/${user}/${path.basename(repo, ".git")}`;
  }

  static getGithubEditUrl(opts: {
    note: NotePropsV2;
    config: DendronConfig;
    wsRoot: string;
  }) {
    const { note, config, wsRoot } = opts;
    const vault = note.vault;
    const vaults = config.vaults;
    const mvault = VaultUtils.matchVault({ wsRoot, vault, vaults });
    const vaultUrl = _.get(mvault, "remote.url", false);
    const gitRepoUrl = config.site.gh_edit_repository;
    // if we have a vault, we don't need to include the vault name as an offset
    if (mvault && vaultUrl) {
      return _.join(
        [
          this.git2Github(vaultUrl),
          config.site.gh_edit_view_mode,
          config.site.gh_edit_branch,
          note.fname + ".md",
        ],
        "/"
      );
    }

    let gitNotePath = _.join(
      [path.basename(vault.fsPath), note.fname + ".md"],
      "/"
    );
    if (_.has(note?.custom, RESERVED_KEYS.GIT_NOTE_PATH)) {
      gitNotePath = formatString({
        txt: note.custom[RESERVED_KEYS.GIT_NOTE_PATH],
        note,
      });
    }
    // this assumes we have a workspace url
    return _.join(
      [
        gitRepoUrl,
        config.site.gh_edit_view_mode,
        config.site.gh_edit_branch,
        gitNotePath,
      ],
      "/"
    );
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
