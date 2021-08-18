export type SeedConfig = {
  id: string;
  name: string;
  publisher: string;
  license: string;
  root: string;
  description: string;
  repository: SeedRepository;
  contact?: SeedContact;
  /**
   * Url for seed
   */
  site?: SeedSite;
  assets?: SeedBrowserAssets;
};

export type SeedSite = {
  url: string;
  index?: string;
};

export type SeedRepository = {
  type: "git";
  url: string;
  contact?: SeedContact;
};

export type SeedContact = {
  name: string;
  email?: string;
  url?: string;
};

export enum SeedCommands {
  ADD = "add",
  INIT = "init",
  INFO = "info",
  REMOVE = "remove",
}

export type SeedBrowserAssets = {
  seedIcon?: string;
  publisherLogo?: string;
};

// export type SeedRegistryEntry = {} & SeedConfig;

export type SeedRegistryDict = { [key: string]: SeedConfig | undefined };

export const SEED_REGISTRY: SeedRegistryDict = {
  "dendron.dendron-site": {
    id: "dendron.dendron-site",
    name: "dendron-site",
    publisher: "dendron",
    description:
      "The Dendron Wiki. This contains the Dendron user guide, from getting started to advanced features. This also has information for Dendron developers.",
    license: "Creative Commons Attribution 4.0 International",
    root: "vault",
    repository: {
      type: "git",
      url: "https://github.com/dendronhq/dendron-site.git",
    },
    site: {
      url: "https://wiki.dendron.so",
      index: "dendron",
    },
    assets: {
      publisherLogo:
        "https://org-dendron-public-assets.s3.amazonaws.com/images/tutorial-logo_small.png",
    },
  },
  "dendron.handbook": {
    id: "dendron.handbook",
    name: "handbook",
    publisher: "dendron",
    description:
      "The Dendron Company Handbook. Outlines Company Values and Principles.",
    license: "Creative Commons Attribution 4.0 International",
    root: "handbook",
    repository: {
      type: "git",
      url: "https://github.com/dendronhq/handbook.git",
    },
    site: {
      url: "https://handbook.dendron.so",
      index: "handbook",
    },
    assets: {
      publisherLogo:
        "https://org-dendron-public-assets.s3.amazonaws.com/images/tutorial-logo_small.png",
    },
  },
  "dendron.templates": {
    id: "dendron.templates",
    name: "templates",
    publisher: "dendron",
    description: "Templates that can be applied to your new Dendron notes.",
    license: "Creative Commons Attribution 4.0 International",
    root: "templates",
    repository: {
      type: "git",
      url: "https://github.com/dendronhq/templates.git",
    },
    assets: {
      publisherLogo:
        "https://org-dendron-public-assets.s3.amazonaws.com/images/tutorial-logo_small.png",
    },
  },
  "dendron.tldr": {
    id: "dendron.tldr",
    name: "tldr",
    publisher: "dendron",
    description: "Documentation for the most popular CLI tools.",
    license: "Creative Commons Attribution 4.0 International",
    root: "vault",
    repository: {
      type: "git",
      url: "https://github.com/kevinslin/seed-tldr.git",
    },
    site: {
      url: "https://tldr.dendron.so",
      index: "cli",
    },
    assets: {
      publisherLogo:
        "https://org-dendron-public-assets.s3.amazonaws.com/images/tutorial-logo_small.png",
    },
  },
  "dendron.xkcd": {
    id: "dendron.xkcd",
    name: "xkcd",
    publisher: "dendron",
    description: "A complete collection of xkcd comics by Randall Monroe",
    license: "Creative Commons Attribution-NonCommercial 2.5 License",
    root: "vault",
    repository: {
      type: "git",
      url: "https://github.com/kevinslin/seed-xkcd.git",
    },
    site: {
      url: "https://xkcd.dendron.so",
    },
    assets: {
      publisherLogo:
        "https://org-dendron-public-assets.s3.amazonaws.com/images/tutorial-logo_small.png",
    },
  },
  "dendron.aws": {
    id: "dendron.aws",
    name: "aws",
    publisher: "dendron",
    description: "Documentation on all things related to AWS.",
    license: "Multiple",
    root: "vault",
    repository: {
      type: "git",
      url: "https://github.com/dendronhq/dendron-aws-vault.git",
    },
    site: {
      url: "https://aws.dendron.so",
    },
    assets: {
      publisherLogo:
        "https://org-dendron-public-assets.s3.amazonaws.com/images/tutorial-logo_small.png",
    },
  },
};
