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
