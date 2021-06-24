import { SeedConfig } from "@dendronhq/common-all";
import { readYAML } from "@dendronhq/common-server";

type SeedRegistryEntry = {} & SeedConfig;

type SeedRegistryDict = { [key: string]: SeedRegistryEntry | undefined };

const SEED_REGISTRY: SeedRegistryDict = {
  "dendron.dendron-site": {
    name: "dendron-site",
    publisher: "dendron",
    description: "Dendron site docs",
    license: "Creative Commons Attribution 4.0 International",
    root: "vault",
    repository: {
      type: "git",
      url: "git@github.com:dendronhq/dendron-site.git",
    },
    site: {
      url: "https://wiki.dendron.so",
      index: "dendron",
    },
  },
  "dendron.handbook": {
    name: "handbook",
    publisher: "dendron",
    description: "Dendron Public Handbook",
    license: "Creative Commons Attribution 4.0 International",
    root: "handbook",
    repository: {
      type: "git",
      url: "git@github.com:dendronhq/handbook.git",
    },
    site: {
      url: "https://handbook.dendron.so",
      index: "handbook",
    },
  },
  "dendron.tldr": {
    name: "tldr",
    publisher: "dendron",
    description: "CLI Docs",
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
  },
  "dendron.xkcd": {
    name: "xkcd",
    publisher: "dendron",
    description: "CLI Docs",
    license: "Creative Commons Attribution-NonCommercial 2.5 License",
    root: "vault",
    repository: {
      type: "git",
      url: "https://github.com/kevinslin/seed-xkcd.git",
    },
    site: {
      url: "https://xkcd.dendron.so",
    },
  },
  "dendron.aws": {
    name: "aws",
    publisher: "dendron",
    description: "AWS Docs",
    license: "Multiple",
    root: "vault",
    repository: {
      type: "git",
      url: "https://github.com/dendronhq/dendron-aws-vault.git",
    },
    site: {
      url: "https://aws.dendron.so",
    },
  },
};

type SeedCommandOpts = {
  id: string;
};

export class SeedRegistry {
  public registry: SeedRegistryDict;

  static create(opts?: { registryFile?: string }) {
    let registry = SEED_REGISTRY;
    if (opts?.registryFile) {
      registry = readYAML(opts.registryFile) as SeedRegistryDict;
    }
    return new SeedRegistry(registry);
  }

  constructor(registry: SeedRegistryDict) {
    this.registry = registry;
  }

  info({ id }: SeedCommandOpts) {
    return this.registry[id];
  }
}
