import { SeedConfig } from "@dendronhq/common-all";

type SeedRegistryEntry = {} & SeedConfig;

type SeedRegistryDict = { [key: string]: SeedRegistryEntry | undefined };

export class SeedUtils {
  static getSeedId({ publisher, name }: { publisher: string; name: string }) {
    return `${publisher}.${name}`;
  }
}

const SEED_REGISTRY: SeedRegistryDict = {
  "dendron.dendron-site": {
    name: "dendron-site",
    publisher: "dendron",
    description: "Dendron site docs",
    license: "Creative Commons",
    root: "vault",
  },
};

export class SeedRegistry {
  public registry: SeedRegistryDict;

  static create() {
    return new SeedRegistry(SEED_REGISTRY);
  }

  constructor(registry: SeedRegistryDict) {
    this.registry = registry;
  }

  info({ id }: { id: string }) {
    return this.registry[id];
  }
}
