import { DendronConfigEntry, DendronConfigEntryCollection } from "../base";
import {
  HIERARCHY_DISPLAY,
  HIERARCHY_DISPLAY_TITLE,
  USE_FM_TITLE,
  USE_NOTE_TITLE_FOR_LINK,
  MERMAID,
  USE_NUNJUCKS,
  USE_KATEX,
  USE_PRETTY_REFS,
  NO_LEGACY_NOTE_REF,
} from "../global/global";
import { DVault } from "../../workspace";

/**
 * Namespace for all publishing related configurations
 */
export type DendronPublishingConfig = {
  useFMTitle: boolean; // TODO: split implementation to respect non-global config
  hierarchyDisplay: boolean; // TODO: split
  hierarchyDisplayTitle: string; // TODO: split
  useNoteTitleForLink: boolean; // TODO: split
  mermaid: boolean;
  useNunjucks: boolean;
  usePrettyRefs: boolean;
  useKatex: boolean;
  noLegacyNoteRef: boolean;

  assetsPrefix?: string;
  canonicalBaseUrl?: string;
  copyAssets?: boolean;
  customHeaderPath?: string;
  ga_tracking?: string;
  siteFaviconPath?: string;
  logo?: string;
  siteIndex?: string;
  siteHierarchies: string[];
  siteLastModified?: boolean;
  siteRootDir: string;
  siteRepoDir?: string;
  siteUrl?: string;
  githubCname?: string;
  gh_edit_link?: boolean;
  gh_edit_link_text?: string;
  gh_edit_branch?: string;
  gh_edit_view_mode?: GithubEditViewMode;
  gh_edit_repository?: string;
  showFrontMatterTags?: boolean;
  noRandomlyColoredTags?: boolean;
  config?: { [key: string]: HierarchyConfig };
  duplicateNoteBehavior?: DuplicateNoteBehavior;
  writeStubs?: boolean;
  title?: string;
  description?: string;
  author?: string;
  twitter?: string;
  image?: string;
  useContainers?: boolean;
  generateChangelog?: boolean;
  previewPort?: boolean;
  segmentKey?: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
  usePrettyLinks?: boolean;
};

export enum GithubEditViewModeEnum {
  tree = "tree",
  edit = "edit",
}

export type GithubEditViewMode = keyof typeof GithubEditViewModeEnum;

export enum DuplicateNoteActionEnum {
  useVault = "useVault",
}

export type DuplicateNoteAction = keyof typeof DuplicateNoteActionEnum;

export type UseVaultBehaviorPayload = { vault: DVault } | string[];

export type DuplicateNoteActionPayload = UseVaultBehaviorPayload;

export type DuplicateNoteBehavior = {
  action: DuplicateNoteAction;
  payload: DuplicateNoteActionPayload;
};

export type HierarchyConfig = {
  publishByDefault?: boolean | { [key: string]: boolean };
  noindexByDefault?: boolean;
  customFrontmatter?: CustomFMEntry[];
};

export type CustomFMEntry = {
  key: string;
  value: any;
};

const GITHUB_EDIT_VIEW_MODE: {
  [key in GithubEditViewMode]: DendronConfigEntry<string>;
} = {
  edit: {
    value: GithubEditViewModeEnum.edit,
    label: "edit",
    desc: "Links directly to edit mode.",
  },
  tree: {
    value: GithubEditViewModeEnum.tree,
    label: "tree",
    desc: "Links to Github page.",
  },
};
/**
 * Constants holding all publishing config related {@link DendronConfigEntry}
 */
export const PUBLISHING: DendronConfigEntryCollection<DendronPublishingConfig> =
  {
    useFMTitle: USE_FM_TITLE("publishing"),
    hierarchyDisplay: HIERARCHY_DISPLAY("publishing"),
    hierarchyDisplayTitle: HIERARCHY_DISPLAY_TITLE("publishing"),
    useNoteTitleForLink: USE_NOTE_TITLE_FOR_LINK("publishing"),
    mermaid: MERMAID("publishing"),
    useNunjucks: USE_NUNJUCKS("publishing"),
    usePrettyRefs: USE_PRETTY_REFS("publishing"),
    useKatex: USE_KATEX("publishing"),
    noLegacyNoteRef: NO_LEGACY_NOTE_REF("publishing"),
    assetsPrefix: {
      label: "assets prefix",
      desc: "Prefix for assets for publishing.",
    },
    canonicalBaseUrl: {
      label: "canonical base URL",
      desc: "The base URL used for generating canonical URLs from each page for publishing.",
    },
    copyAssets: {
      label: "copy assets",
      desc: "Copy assets from vault to published site.",
    },
    customHeaderPath: {
      label: "custom header path",
      desc: "Path to the custom header file to include in each published notes.",
    },
    ga_tracking: {
      label: "GA tracking",
      desc: "Google Analytics tracking number. Set this if you use GA.",
    },
    siteFaviconPath: {
      label: "site favicon path",
      desc: "Path to favicon relative to the workspace.",
    },
    logo: {
      label: "logo",
      desc: "Path to the site logo.",
    },
    siteIndex: {
      label: "site index",
      desc: "The domain of your `siteHierarhcies` page.",
    },
    siteHierarchies: {
      label: "site hierarchies",
      desc: "List of hierarchies to publish.",
    },
    siteLastModified: {
      label: "site last modified",
      desc: "Show last modified timestamp on the site",
    },
    siteRootDir: {
      label: "site root dir",
      desc: "Where your site will be published, relative to the Dendron workspace.",
    },
    siteRepoDir: {
      label: "site repo dir",
      desc: "Location of the Github repository where your site notes are located. By default this is assumed to be your workspace root.",
    },
    siteUrl: {
      label: "site URL",
      desc: "URL of the site without trailing slash.",
    },
    githubCname: {
      label: "Github CNAME",
      desc: "CNAME used for Github Pages",
    },
    gh_edit_link: {
      label: "Github edit link",
      desc: "Add a link to Github where you can edit the page.",
    },
    gh_edit_link_text: {
      label: "Github edit link text",
      desc: "Text to use for the Github edit link",
    },
    gh_edit_branch: {
      label: "Github edit branch",
      desc: "Branch that the site is served from ",
    },
    gh_edit_view_mode: GITHUB_EDIT_VIEW_MODE,
    gh_edit_repository: {
      label: "Github edit repository",
      desc: "URL of the Github repository. This value will be ignored if you are using remote vaults.",
    },
    showFrontMatterTags: {
      label: "show frontmatter tags",
      desc: "Show Frontmatter tags in published site.",
    },
    noRandomlyColoredTags: {
      label: "no randomly colored tags",
      desc: "Do not display randomly generated colors for tags. Only color that were configured in the frontmatter are rendered.",
    },
    config: {
      label: "config",
      desc: "Control publication on a per-hierarchy basis",
    },
    duplicateNoteBehavior: {
      label: "duplicate note behavior",
      desc: "How duplicate notes are handled when publishing a multi-vault workspace.",
    },
    writeStubs: {
      label: "write stubs",
      desc: "Write stub notes to disk when publishing. If this is set to fale, stub notes will be published with a different id each time.",
    },
    title: {
      label: "title",
      desc: "Set SEO title.",
    },
    description: {
      label: "description",
      desc: "Set SEO description.",
    },
    author: {
      label: "author",
      desc: "Set SEO author.",
    },
    twitter: {
      label: "twitter",
      desc: "set SEO twitter.",
    },
    image: {
      label: "image",
      desc: "Set SEO image.",
    },
    useContainers: {
      label: "use containers",
      desc: "Use remark-containers in published site.",
    },
    generateChangelog: {
      label: "generate changelog",
      desc: "Generate changelog for published site.",
    },
    previewPort: {
      label: "preview port",
      desc: "Set an alternative port to be used for previewing published site.",
    },
    segmentKey: {
      label: "segment key",
      desc: "Value of the Segment API key.",
    },
    cognitoUserPoolId: {
      label: "cognito user pool ID",
      desc: "Value of Cognito user pool ID.",
    },
    cognitoClientId: {
      label: "cognito client ID",
      desc: "Value of Cognito client ID.",
    },
    usePrettyLinks: {
      label: "use pretty links",
      desc: "Note links are published without the .html file extension.",
    },
  };

export function genDefaultPublishingConfig(): DendronPublishingConfig {
  return {
    useFMTitle: true,
    hierarchyDisplay: true,
    hierarchyDisplayTitle: "children",
    useNoteTitleForLink: true,
    mermaid: true,
    useKatex: true,
    useNunjucks: false,
    usePrettyRefs: true,
    noLegacyNoteRef: true,
    copyAssets: true,
    siteHierarchies: ["root"],
    siteRootDir: "docs",
    title: "Dendron",
    description: "Personal knowledge space",
    siteLastModified: true,
  };
}
