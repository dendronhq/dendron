import _ from "lodash";
import path from "path";
import type { DVault, DendronConfig, NoteProps } from "./types";
import { RESERVED_KEYS, FOLDERS } from "./constants";
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
  wsRoot?: string;
}) {
  const { note, config, wsRoot } = opts;
  const vault = note.vault;
  const vaults = ConfigUtils.getVaults(config);
  const mvault = wsRoot
    ? VaultUtils.matchVault({ wsRoot, vault, vaults })
    : VaultUtils.matchVaultV2({ vault, vaults });
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

/**
 * Convert a github repo orul to access token format
 */
export function getGithubAccessTokenUrl(opts: {
  remotePath: string;
  accessToken: string;
}) {
  const { remotePath, accessToken } = opts;
  let repoPath: string;
  if (remotePath.startsWith("https://")) {
    repoPath = remotePath.split("/").slice(-2).join("/");
  } else {
    repoPath = opts.remotePath.split(":").slice(-1)[0];
  }
  return `https://${accessToken}:x-oauth-basic@github.com/${repoPath}`;
}

export function getOwnerAndRepoFromURL(url: string) {
  const [owner, repo] = url.split("/").slice(-2);
  return { owner, repo };
}

export function getRepoNameFromURL(url: string): string {
  return path.basename(url, ".git");
}

/** Find the dependency path for a vault given the remote url. You can use
 * this even if the vault has no remote.
 *
 * This is the relative path within the dependencies folder, like
 * `github.com/dendronhq/dendron-site`. For more details see the
 * [[Self Contained Vaults RFC|dendron://dendron.docs/rfc.42-self-contained-vaults]]
 */
export function remoteUrlToDependencyPath({
  vaultName,
  url,
}: {
  vaultName: string;
  url?: string;
}): string {
  // If no remote URL exists, then it's a local vault. We keep these in a
  // local-only folder.
  if (url === undefined) return FOLDERS.LOCAL_DEPENDENCY;
  // Check if it matches any web URLs like
  // https://github.com/dendronhq/dendron-site.git This may also look like
  // http://example.com:8000/dendronhq/dendron-site.git, we skip the port
  const webMatch =
    // starts with http:// or https://
    // followed by the domain, which will continue until we hit /
    // if we see a port definition like :8000, we skip it for simplicity
    // then we have the path of the URL, like dendronhq/dendron-site
    // finally, if there's a `.git` we'll discard that for a cleaner name
    /^(https?:\/\/)(?<domain>[^/:]+)(:[0-9]+)?\/(?<path>.+?)(\.git)?$/.exec(
      url
    );
  if (webMatch?.groups?.domain && webMatch?.groups?.path) {
    // matched a HTTP/S git remote
    return path.join(
      webMatch.groups.domain,
      // Normalize for Windows so forward slashes are converted to backward ones
      path.normalize(webMatch.groups.path)
    );
  }
  // Check if it matches any SSH URLs like
  // git@github.com:dendronhq/dendron-site.git This may also look like
  // git@example.com:220/dendronhq/dendron-site.git, we skip the port and the
  const sshMatch =
    // SSH urls start with a user, like git@ or gitlab@, which we skip
    // followed by the domain, which will continue until we hit :
    // if we see a port definition like :8000, we skip it for simplicity
    // then we have the path of the URL, like dendronhq/dendron-site
    // this path may optionally begin with a /, which we'll skip
    // finally, if there's a `.git` we'll discard that for a cleaner name
    /^([^@]+@)(?<domain>[^:/]+):([0-9]+\/)?\/?(?<path>.+?)(\.git)?$/.exec(url);
  if (sshMatch?.groups?.domain && sshMatch?.groups?.path) {
    // matched a HTTP/S git remote
    return path.join(
      sshMatch.groups.domain,
      // Normalize for Windows so forward slashes are converted to backward ones
      path.normalize(sshMatch.groups.path)
    );
  }
  // If none of these worked, try to make a fallback path. This may be because
  // the remote points to a local directory, or because it's something we
  // didn't expect.
  const fallback = _.findLast(url.split(/[/\\]/), (part) => part.length > 0);
  if (fallback) return fallback;
  // Fallback for the fallback: if all else fails, just use the vault name
  return vaultName;
}

/** If this vault had this remote, what path should it be stored under?
 *
 * If the remote is null, then you'll get the path should be if the vault was a local vault.
 */
export function getDependencyPathWithRemote({
  vault,
  remote,
}: {
  remote: string | null;
  vault: DVault;
}): string {
  const vaultName =
    vault.name ??
    // if the vault has no name, compute one based on the path
    _.findLast(vault.fsPath.split(/[/\\]/), (part) => part.length > 0) ??
    // Fall back to fsPath directly if the calculation fails
    vault.fsPath;

  if (!remote) {
    // local
    return path.join(FOLDERS.DEPENDENCIES, FOLDERS.LOCAL_DEPENDENCY, vaultName);
  } else {
    return path.join(
      FOLDERS.DEPENDENCIES,
      remoteUrlToDependencyPath({
        vaultName,
        url: remote,
      })
    );
  }
}

export function getVaultFromRepo(opts: {
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
