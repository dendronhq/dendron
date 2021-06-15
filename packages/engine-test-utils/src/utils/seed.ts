import { DEngineClient, SeedCommands, SeedConfig } from "@dendronhq/common-all";
import { tmpDir, writeYAML } from "@dendronhq/common-server";
import { SeedCLICommand } from "@dendronhq/dendron-cli";
import { SeedInitMode, SeedUtils } from "@dendronhq/engine-server";
import path from "path";
import { GitTestUtils } from "./git";

export class TestSeedUtils {
  static defaultSeedId = () => {
    return "dendron.foo";
  };

  static async createSeedRegistry(opts: {
    engine: DEngineClient;
    wsRoot: string;
  }) {
    const config = await this.createSeed(opts);
    const id = SeedUtils.getSeedId(config);
    const root = tmpDir().name;
    const registryFile = path.join(root, "reg.yml");
    const seedDict = { [id]: config };
    writeYAML(registryFile, seedDict);
    return { registryFile, seedDict };
  }

  static async createSeed(opts: { engine: DEngineClient; wsRoot: string }) {
    const cli = new SeedCLICommand();
    const cmd = SeedCommands.INIT;
    const id = this.defaultSeedId();
    const seed: SeedConfig = {
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
    await GitTestUtils.addRepoToWorkspace(opts.wsRoot);
    return seed;
  }
}
