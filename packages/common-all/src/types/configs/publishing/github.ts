export enum GithubEditViewModeEnum {
  tree = "tree",
  edit = "edit",
}

export type GithubEditViewMode = keyof typeof GithubEditViewModeEnum;

/**
 * Namespace for publishing related github configs
 */
export type GithubConfig = {
  cname?: string;
  enableEditLink: boolean;
  editLinkText?: string;
  editBranch?: string;
  editViewMode?: GithubEditViewMode;
  editRepository?: string;
};

export function genDefaultGithubConfig(): GithubConfig {
  return {
    enableEditLink: true,
    editLinkText: "Edit this page on GitHub",
    editBranch: "main",
    editViewMode: GithubEditViewModeEnum.tree,
  };
}
