import { SeedConfig } from "@dendronhq/common-all";
import { SEED_REGISTRY } from "@dendronhq/engine-server";

type SeedRegistryEntry = {} & SeedConfig;

type SeedRegistryDict = { [key: string]: SeedRegistryEntry | undefined };

export class SeedUtils {
  static getSeedId({ publisher, name }: { publisher: string; name: string }) {
    return `${publisher}.${name}`;
  }
}

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
