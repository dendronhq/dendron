import { DendronError, ERROR_STATUS, SeedConfig } from "@dendronhq/common-all";
import { SeedUtils } from "./utils";

type SeedRegistryEntry = {} & SeedConfig;

type SeedRegistryDict = { [key: string]: SeedRegistryEntry | undefined };

const SEED_REGISTRY: SeedRegistryDict = {
  "dendron.dendron-site": {
    name: "dendron-site",
    publisher: "dendron",
    description: "Dendron site docs",
    license: "Creative Commons",
    root: "vault",
    repository: {
      type: "git",
      url: "git@github.com:dendronhq/dendron-site.git",
    },
  },
};

type SeedCommandOpts = {
  id: string;
};

export class SeedRegistry {
  public registry: SeedRegistryDict;

  static create() {
    return new SeedRegistry(SEED_REGISTRY);
  }

  constructor(registry: SeedRegistryDict) {
    this.registry = registry;
  }

  async add({ id, wsRoot }: SeedCommandOpts & { wsRoot: string }) {
    const maybeSeed = this.registry[id];
    // validation
    if (!maybeSeed) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.DOES_NOT_EXIST,
          message: `seed ${id} does not exist`,
        }),
      };
    }
    const spath = await SeedUtils.clone({ wsRoot, config: maybeSeed });
    return { data: { spath } };
  }

  info({ id }: SeedCommandOpts) {
    return this.registry[id];
  }
}
