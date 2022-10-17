import { z, schemaForType } from "../../../parse";

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

const githubEditViewModeSchema = schemaForType<GithubEditViewMode>()(
  z.union([
    z.literal(GithubEditViewModeEnum.tree),
    z.literal(GithubEditViewModeEnum.edit),
  ])
);

export const githubSchema = schemaForType<GithubConfig>()(
  z.object({
    cname: z.string().optional(),
    enableEditLink: z.boolean().default(true),
    editLinkText: z.string().optional().default("Edit this page on GitHub"),
    editBranch: z.string().optional().default("main"),
    editViewMode: githubEditViewModeSchema
      .optional()
      .default(GithubEditViewModeEnum.tree),
    editRepository: z.string().optional(),
  })
);
