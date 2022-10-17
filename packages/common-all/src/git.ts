import _ from "lodash";
import path from "path";
import type { DendronConfig, NoteProps } from "./types";
import { RESERVED_KEYS } from "./constants";
import { ConfigUtils } from "./utils";
import { VaultUtils } from "./vault";

const formatString = (opts: { txt: string; note: NoteProps }) => {
  const { txt, note } = opts;
  _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
  const noteHierarchy = note.fname.replace(/\./g, "/");
  return _.template(txt)({ noteHierarchy });
};

/**
 *  NOTICE: Lots of the Git code is obtained from https://github.com/KnisterPeter/vscode-github, licened under MIT
 */

/**
 * Utilities for working with git urls
 */

export function canShowGitLink(opts: {
  config: DendronConfig;
  note: NoteProps;
}) {
  const { config, note } = opts;

  if (
    _.isBoolean((note.custom || {})[RESERVED_KEYS.GIT_NO_LINK]) &&
    note.custom[RESERVED_KEYS.GIT_NO_LINK]
  ) {
    return false;
  }
  const githubConfig = ConfigUtils.getGithubConfig(config);
  return githubConfig
    ? _.every([
        githubConfig.enableEditLink,
        githubConfig.editLinkText,
        githubConfig.editRepository,
        githubConfig.editBranch,
        githubConfig.editViewMode,
      ])
    : false;
}

export function githubUrl(opts: { note: NoteProps; config: DendronConfig }) {
  const url = getGithubEditUrl(opts);
  return url;
}

export function getGithubEditUrl(opts: {
  note: NoteProps;
  config: DendronConfig;
}) {
  const { note, config } = opts;
  const vault = note.vault;
  const vaults = ConfigUtils.getVaults(config);
  const mvault = VaultUtils.matchVaultV2({ vault, vaults });
  const vaultUrl = _.get(mvault, "remote.url", false);
  const githubConfig = ConfigUtils.getGithubConfig(config);
  const gitRepoUrl = githubConfig?.editRepository;
  // if we have a vault, we don't need to include the vault name as an offset
  if (mvault && vaultUrl) {
    return _.join(
      [
        git2Github(vaultUrl),
        githubConfig?.editViewMode,
        githubConfig?.editBranch,
        note.fname + ".md",
      ],
      "/"
    );
  }

  let gitNotePath = _.join(
    [VaultUtils.getRelPath(vault), note.fname + ".md"],
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
      githubConfig?.editViewMode,
      githubConfig?.editBranch,
      gitNotePath,
    ],
    "/"
  );
}

export function git2Github(gitUrl: string) {
  // 'git@github.com:kevinslin/dendron-vault.git'
  // @ts-ignore
  const [_, userAndRepo] = gitUrl.split(":");
  const [user, repo] = userAndRepo.split("/");
  return `https://github.com/${user}/${path.basename(repo, ".git")}`;
}
