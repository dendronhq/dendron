import {
  DendronConfigEntry,
  DendronConfigEntryCollection,
} from "../../types/configs/base";
import {
  DendronPublishingConfig,
  GoogleAnalyticsConfig,
} from "../../types/configs/publishing/publishing";
import { SEOConfig, SEOImage } from "../../types/configs/publishing/seo";
import {
  GithubConfig,
  GithubEditViewModeEnum,
} from "../../types/configs/publishing/github";
import {
  ENABLE_FM_TITLE,
  ENABLE_NOTE_TITLE_FOR_LINK,
  ENABLE_KATEX,
  ENABLE_PRETTY_REFS,
  ENABLE_FRONTMATTER_TAGS,
  ENABLE_HASHES_FOR_FM_TAGS,
  ENABLE_BACK_LINKS,
} from "./global";
import { GiscusConfig } from "../../types";

const GITHUB_EDIT_VIEW_MODE: Record<
  GithubEditViewModeEnum,
  DendronConfigEntry<string>
> = {
  [GithubEditViewModeEnum.edit]: {
    value: GithubEditViewModeEnum.edit,
    label: "Edit",
    desc: "Links directly to edit mode.",
  },
  [GithubEditViewModeEnum.tree]: {
    value: GithubEditViewModeEnum.tree,
    label: "Tree",
    desc: "Links to Github page.",
  },
};

const GITHUB: DendronConfigEntryCollection<GithubConfig> = {
  cname: {
    label: "CNAME",
    desc: "CNAME used for Github Pages",
  },
  enableEditLink: {
    label: "Enable Edit Link",
    desc: "Add a link to Github where you can edit the page.",
  },
  editLinkText: {
    label: "Edit Link Text",
    desc: "Text to use for the Github edit link.",
  },
  editBranch: {
    label: "Edit Branch",
    desc: "Branch that the stie is served from.",
  },
  editViewMode: GITHUB_EDIT_VIEW_MODE,
  editRepository: {
    label: "Edit Repository",
    desc: "URL of the Github repository. This value will be ignored if you are using remote vaults.",
  },
};

const GISCUS: DendronConfigEntryCollection<GiscusConfig> = {
  id: {
    label: "ID",
    desc: "ID of Giscus widget",
  },
  host: {
    label: "Host",
    desc: "Host of the giscus server if you are self-hosting Giscus.",
  },
  repo: {
    label: "Repo",
    desc: "Repository where the discussion is stored.",
  },
  repoId: {
    label: "Repo ID",
    desc: "ID of the Repository where the discussion is stored.",
  },
  category: {
    label: "Category",
    desc: "Category where the discussion will be searched.",
  },
  categoryId: {
    label: "Category ID",
    desc: "ID of the category where the discussion will be searched.",
  },
  mapping: {
    label: "Mapping",
    desc: "Mapping between the parent page and the discussion.",
  },
  term: {
    label: "Term",
    desc: "Search term to use when searching for the discussion.",
  },
  strict: {
    label: "Strict",
    desc: "Use strict title matching",
  },
  reactionsEnabled: {
    label: "Reactions Enabled",
    desc: "Enable reactions to the main post of the discussion.",
  },
  emitMetadata: {
    label: "Emit Metadata",
    desc: "Emit the discussion metadata periodically to the parent page.",
  },
  inputPosition: {
    label: "Input Position",
    desc: "Placement of the comment box (`top` or `bottom`)",
  },
  lang: {
    label: "Language",
    desc: "Language that Giscus will be displayed in.",
  },
  theme: {
    label: "Theme",
    desc: "Theme that Giscus will be displayed in.",
  },
  loading: {
    label: "Loading",
    desc: "Whether the iframe should be loaded lazily or eagerly.",
  },
};

const GA: DendronConfigEntryCollection<GoogleAnalyticsConfig> = {
  tracking: {
    label: "Tracking",
    desc: "Google Analytics tracking number",
  },
};

const IMAGE: DendronConfigEntryCollection<SEOImage> = {
  url: {
    label: "URL",
    desc: "URL of image",
  },
  alt: {
    label: "alt",
    desc: "alt text for image",
  },
};

const SEO: DendronConfigEntryCollection<SEOConfig> = {
  title: {
    label: "Title",
    desc: "Set SEO title.",
  },
  description: {
    label: "Description",
    desc: "Set SEO description.",
  },
  author: {
    label: "Author",
    desc: "Set SEO author.",
  },
  twitter: {
    label: "Twitter",
    desc: "set SEO twitter.",
  },
  image: IMAGE,
};

export const PUBLISHING: DendronConfigEntryCollection<DendronPublishingConfig> =
  {
    enableFMTitle: ENABLE_FM_TITLE("publishing"),
    enableHierarchyDisplay: {
      label: "Enable Hierarchy Display",
      desc: "Enable rendering of children link block at the end of the note.",
    },
    hierarchyDisplayTitle: {
      label: "Hierarchy Display Title",
      desc: "Title to display for the children links block.",
    },
    enableNoteTitleForLink: ENABLE_NOTE_TITLE_FOR_LINK("publishing"),
    enablePrettyRefs: ENABLE_PRETTY_REFS("publishing"),
    enableKatex: ENABLE_KATEX("publishing"),
    assetsPrefix: {
      label: "Assets Prefix",
      desc: "Prefix for assets for publishing.",
    },
    canonicalBaseUrl: {
      label: "Canonical Base URL",
      desc: "The base URL used for generating canonical URLs from each page for publishing.",
    },
    copyAssets: {
      label: "Copy Assets",
      desc: "Copy assets from vault to published site.",
    },
    customHeaderPath: {
      label: "Custom Header Path",
      desc: "Path to the custom header file to include in each published notes.",
    },
    ga: GA,
    siteFaviconPath: {
      label: "Site Favicon Path",
      desc: "Path to favicon relative to the workspace.",
    },
    logoPath: {
      label: "Logo Path",
      desc: "Path to the site logo.",
    },
    siteIndex: {
      label: "Site Index",
      desc: "The domain of your `siteHierarhcies` page.",
    },
    siteHierarchies: {
      label: "Site Hierarchies",
      desc: "List of hierarchies to publish.",
    },
    enableSiteLastModified: {
      label: "Site Last Modified",
      desc: "Show last modified timestamp on the site",
    },
    siteRootDir: {
      label: "Site Root Dir",
      desc: "Where your site will be published, relative to the Dendron workspace.",
    },
    siteUrl: {
      label: "Site URL",
      desc: "URL of the site without trailing slash.",
    },
    enableBackLinks: ENABLE_BACK_LINKS("publishing"),
    enableFrontmatterTags: ENABLE_FRONTMATTER_TAGS("publishing"),
    enableHashesForFMTags: ENABLE_HASHES_FOR_FM_TAGS("publishing"),
    enableRandomlyColoredTags: {
      label: "Enable Randomly Colored Tags",
      desc: "Display randomly generated colors for tags.",
    },
    hierarchy: {
      label: "Hierarchy",
      desc: "Control publication on a per-hierarchy basis",
    },
    duplicateNoteBehavior: {
      label: "Duplicate Note Behavior",
      desc: "How duplicate notes are handled when publishing a multi-vault workspace.",
    },
    writeStubs: {
      label: "Write Stubs",
      desc: "Write stub notes to disk when publishing. If this is set to fale, stub notes will be published with a different id each time.",
    },
    seo: SEO,
    github: GITHUB,
    segmentKey: {
      label: "Segment Key",
      desc: "Value of the Segment API key.",
    },
    cognitoUserPoolId: {
      label: "Cognito User Pool ID",
      desc: "Value of Cognito user pool ID.",
    },
    cognitoClientId: {
      label: "Cognito Client ID",
      desc: "Value of Cognito client ID.",
    },
    enablePrettyLinks: {
      label: "Enable Pretty Links",
      desc: "Note links are published without the .html file extension.",
    },
    theme: {
      value: undefined,
      label: "The theme to use when publishing.",
      desc: "The theme to use when publishing the site. If you are using a custom theme, make sure to create the CSS file too.",
    },
    enableTaskNotes: {
      value: true,
      label: "Enable special formatting for task notes.",
      desc: "Task notes will have checkboxes, owner information and more displayed on links leading to them. This applies both in preview and publishing.",
    },
    siteBanner: {
      label: "Add a custom banner to the site",
      desc: "EXPERIMENTAL: do not use",
    },
    giscus: GISCUS,
    sidebarPath: {
      label: "Path to sidebar config file",
      desc: "Define custom sidebar",
      value: undefined,
    },
    searchMode: {
      label: "Default search mode for publishing",
      desc: "Default behavior of search bar in published site",
    },
  };
