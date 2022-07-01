import { DEngineClient, SeedCommands, SeedConfig } from "@dendronhq/common-all";
import { tmpDir, writeYAML } from "@dendronhq/common-server";
import { SeedCLICommand } from "@dendronhq/dendron-cli";
import { SeedInitMode, SeedService, SeedUtils } from "@dendronhq/engine-server";
import path from "path";
import { GitTestUtils } from "./git";

export class TestSeedUtils {
  static defaultSeedId = () => {
    return "dendron.foo";
  };

  static async addSeed2WS({
    wsRoot,
    engine,
    modifySeed,
  }: {
    wsRoot: string;
    engine: DEngineClient;
    modifySeed?: (seed: SeedConfig) => SeedConfig;
  }) {
    const { registryFile } = await this.createSeedRegistry({
      engine,
      wsRoot,
      modifySeed,
    });
    const id = this.defaultSeedId();
    const seedService = new SeedService({ wsRoot, registryFile });
    await seedService.addSeed({ id });
  }

  static async createSeedRegistry(opts: {
    engine: DEngineClient;
    wsRoot: string;
    modifySeed?: (seed: SeedConfig) => SeedConfig;
  }) {
    let config = await this.createSeed(opts);
    const id = SeedUtils.getSeedId(config);
    const root = tmpDir().name;
    const registryFile = path.join(root, "reg.yml");
    if (opts.modifySeed) {
      config = opts.modifySeed(config);
    }
    const seedDict = { [id]: config };
    writeYAML(registryFile, seedDict);
    return { registryFile, seedDict };
  }

  static async createSeed(opts: { engine: DEngineClient; wsRoot: string }) {
    const cli = new SeedCLICommand();
    const cmd = SeedCommands.INIT;
    const id = this.defaultSeedId();
    const seed: SeedConfig = {
      id: "dendron.foo",
      description: "",
      license: "",
      name: "foo",
      publisher: "dendron",
      repository: {
        type: "git",
        url: `file://${opts.wsRoot}`,
      },
      root: "vault",
    };
    await cli.execute({
      cmd,
      id,
      server: {} as any,
      config: seed,
      mode: SeedInitMode.CREATE_WORKSPACE,
      ...opts,
    });
    try {
      await GitTestUtils.addRepoToWorkspace(opts.wsRoot);
      // eslint-disable-next-line no-empty
    } catch (err) {}
    return seed;
  }
}
