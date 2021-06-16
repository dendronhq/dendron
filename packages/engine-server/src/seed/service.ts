import {
  assertUnreachable,
  CONSTANTS,
  DendronError,
  ERROR_STATUS,
  SeedConfig,
  VaultUtils,
} from "@dendronhq/common-all";
import { writeYAML } from "@dendronhq/common-server";
import path from "path";
import { WorkspaceService } from "../workspace";
import { SeedRegistry } from "./registry";
import { SeedUtils } from "./utils";

export enum SeedInitMode {
  CREATE_WORKSPACE = "create_workspace",
  CONVERT_WORKSPACE = "convert_workspace",
}

export class SeedService {
  public wsRoot: string;
  public registryFile?: string;
  protected registry: SeedRegistry;

  /**
   *
   * @param wsRoot - root of file
   * @param registryFile - custom yml file to look for registry
   */
  constructor({
    wsRoot,
    registryFile,
    registry,
  }: {
    wsRoot: string;
    registryFile?: string;
    registry?: SeedRegistry;
  }) {
    this.wsRoot = wsRoot;
    this.registryFile = registryFile;
    this.registry = registry || SeedRegistry.create({ registryFile });
  }

  async addSeed({
    id,
    wsRoot,
    metaOnly,
  }: {
    id: string;
    wsRoot: string;
    metaOnly?: boolean;
  }) {
    // clone
    const maybeSeed = await this.registry.info({ id });
    if (!maybeSeed) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.DOES_NOT_EXIST,
          message: `seed ${id} does not exist`,
        }),
      };
    }
    this.addSeedMetadata({ seed: maybeSeed, wsRoot });
    let seedPath;
    if (!metaOnly) {
      seedPath = await this.cloneSeed({ wsRoot, seed: maybeSeed });
    }
    return { data: { seedPath, seed: maybeSeed } };
  }

  /**
   * Add seed metadata.
   * @returns
   */
  async addSeedMetadata({
    seed,
    wsRoot,
  }: {
    seed: SeedConfig;
    wsRoot: string;
  }) {
    // add metadata
    const ws = new WorkspaceService({ wsRoot });
    const config = ws.config;
    const id = SeedUtils.getSeedId({ ...seed });
    if (!config.seeds) {
      config.seeds = {};
    }
    config.seeds[id] = {};
    await ws.addVault({
      vault: {
        fsPath: seed.root,
        seed: id,
        name: id,
      },
      addToWorkspace: true,
      config,
      writeConfig: true,
    });

    return { seed };
  }

  async cloneSeed({ seed, wsRoot }: { seed: SeedConfig; wsRoot: string }) {
    const spath = await SeedUtils.clone({ wsRoot, config: seed });
    return spath;
  }

  async init(opts: { seed: SeedConfig; wsRoot: string; mode: SeedInitMode }) {
    const { wsRoot, seed, mode } = opts;
    const cpath = path.join(wsRoot, CONSTANTS.DENDRON_SEED_CONFIG);

    switch (mode) {
      case SeedInitMode.CREATE_WORKSPACE: {
        // write seed config
        writeYAML(cpath, seed);
        const ws = await WorkspaceService.createWorkspace({
          wsRoot,
          vaults: [],
          createCodeWorkspace: true,
        });
        let config = ws.config;
        await ws.createVault({
          vault: { fsPath: "vault" },
          addToWorkspace: true,
          config,
          writeConfig: false,
        });
        await ws.setConfig(config);
        break;
      }
      case SeedInitMode.CONVERT_WORKSPACE: {
        const { error } = SeedUtils.validateWorkspaceSeedConversion({ wsRoot });
        if (error) {
          return {
            error,
          };
        }
        const ws = new WorkspaceService({ wsRoot });
        const vaultPath = VaultUtils.getRelPath(ws.config.vaults[0]);
        seed.root = vaultPath;
        writeYAML(cpath, seed);
        // validate
        break;
      }
      default:
        assertUnreachable();
    }
    return {
      data: {
        seed,
      },
    };
  }

  async info({ id }: { id: string }) {
    const resp = this.registry.info({ id });
    return resp;
  }
}
