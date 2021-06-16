import {
  assertUnreachable,
  CONSTANTS,
  DendronError,
  ERROR_STATUS,
  SeedConfig,
  VaultUtils,
} from "@dendronhq/common-all";
import { writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
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

  protected async getSeedOrErrorFromId(
    id: string
  ): Promise<SeedConfig | DendronError> {
    const maybeSeed = await this.registry.info({ id });
    if (!maybeSeed) {
      return DendronError.createFromStatus({
        status: ERROR_STATUS.DOES_NOT_EXIST,
        message: `seed ${id} does not exist`,
      });
    }
    return maybeSeed;
  }

  async addSeed({ id, metaOnly }: { id: string; metaOnly?: boolean }) {
    const seedOrError = await this.getSeedOrErrorFromId(id);
    if (seedOrError instanceof DendronError) {
      return {
        error: seedOrError,
      };
    }
    this.addSeedMetadata({ seed: seedOrError, wsRoot: this.wsRoot });
    let seedPath;
    if (!metaOnly) {
      seedPath = await this.cloneSeed({ seed: seedOrError });
    }
    return { data: { seedPath, seed: seedOrError } };
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
    const ws = new WorkspaceService({ wsRoot });
    const config = ws.config;
    const id = SeedUtils.getSeedId({ ...seed });
    if (!config.seeds) {
      config.seeds = {};
    }
    config.seeds[id] = {};
    await ws.addVault({
      vault: SeedUtils.seed2Vault({ seed }),
      updateWorkspace: true,
      config,
      updateConfig: true,
    });

    return { seed };
  }

  async cloneSeed({ seed }: { seed: SeedConfig }) {
    const spath = await SeedUtils.clone({ wsRoot: this.wsRoot, config: seed });
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
          updateWorkspace: true,
          config,
          updateConfig: false,
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

  async removeSeed({ id }: { id: string }) {
    const ws = new WorkspaceService({ wsRoot: this.wsRoot });
    const config = ws.config;
    if (!_.has(config.seeds, id)) {
      return {
        error: new DendronError({
          status: ERROR_STATUS.DOES_NOT_EXIST,
          message: `seed with id ${id} not in dendron.yml`,
        }),
      };
    }
    const seedOrError = await this.getSeedOrErrorFromId(id);
    if (seedOrError instanceof DendronError) {
      return {
        error: seedOrError,
      };
    }
    await this.removeSeedMetadata({ seed: seedOrError });
    const spath = SeedUtils.seed2Path({ wsRoot: this.wsRoot, id });
    if (fs.pathExistsSync(spath)) {
      fs.removeSync(spath);
    }
    return { data: {} };
  }

  async removeSeedMetadata({ seed }: { seed: SeedConfig }) {
    const ws = new WorkspaceService({ wsRoot: this.wsRoot });
    await ws.removeVault({
      vault: SeedUtils.seed2Vault({ seed }),
      updateWorkspace: true,
    });
    // remove seed entry
    const config = ws.config;
    delete (config.seeds || {})[SeedUtils.getSeedId(seed)];
    ws.setConfig(config);
  }
}
