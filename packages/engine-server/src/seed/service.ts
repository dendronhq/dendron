import {
  assertUnreachable,
  CONSTANTS,
  DendronError,
  DVault,
  ERROR_STATUS,
  SeedConfig,
  SeedEntry,
  VaultUtils,
  WorkspaceType,
} from "@dendronhq/common-all";
import { simpleGit, writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DConfig } from "../config";
import { WorkspaceService, WorkspaceUtils } from "../workspace";
import { SeedRegistry } from "./registry";
import { SeedUtils } from "./utils";

export enum SeedInitMode {
  CREATE_WORKSPACE = "create_workspace",
  CONVERT_WORKSPACE = "convert_workspace",
}

export type SeedSvcResp = {
  data?: {
    seed: SeedConfig;
    seedPath?: string; // optional, not set if we're working with metadata only
  };
  error?: DendronError;
};

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

  async addSeed({
    id,
    metaOnly,
    onUpdatingWorkspace,
    onUpdatedWorkspace,
  }: {
    id: string;
    metaOnly?: boolean;
    onUpdatingWorkspace?: () => Promise<void>;
    onUpdatedWorkspace?: () => Promise<void>;
  }): Promise<SeedSvcResp> {
    const seedOrError = await this.getSeedOrErrorFromId(id);
    if (seedOrError instanceof DendronError) {
      return {
        error: seedOrError,
      };
    }
    let seedPath;

    // Seed cloning must occur before the metadata changes - if the current
    // workspace that is open is the one being modified in addSeedMetadata(), VS
    // Code will reload the current window and the seed cloning may not execute.
    if (!metaOnly) {
      seedPath = await this.cloneSeed({ seed: seedOrError });
    }
    await this.addSeedMetadata({
      seed: seedOrError,
      wsRoot: this.wsRoot,
      onUpdatingWorkspace,
      onUpdatedWorkspace,
    });
    return { data: { seedPath, seed: seedOrError } };
  }

  /**
   * Add seed metadata.
   * @returns
   */
  async addSeedMetadata({
    seed,
    wsRoot,
    onUpdatingWorkspace,
    onUpdatedWorkspace,
  }: {
    seed: SeedConfig;
    wsRoot: string;
    onUpdatingWorkspace?: () => Promise<void>;
    onUpdatedWorkspace?: () => Promise<void>;
  }) {
    const ws = new WorkspaceService({ wsRoot });
    const config = ws.config;
    const id = SeedUtils.getSeedId({ ...seed });
    if (!config.seeds) {
      config.seeds = {};
    }
    const seedEntry: SeedEntry = {};
    if (seed.site) {
      seedEntry.site = seed.site;
    }
    config.seeds[id] = seedEntry;

    const updateWorkspace =
      WorkspaceUtils.getWorkspaceTypeFromDir(wsRoot) === WorkspaceType.CODE;
    await ws.addVault({
      vault: SeedUtils.seed2Vault({ seed }),
      config,
      updateConfig: true,
      updateWorkspace,
      onUpdatingWorkspace,
      onUpdatedWorkspace,
    });

    return { seed };
  }

  /**
   *
   * @param branch - optional branch to clone from
   * @returns
   */
  async cloneSeed({ seed, branch }: { seed: SeedConfig; branch?: string }) {
    const wsRoot = this.wsRoot;
    const id = SeedUtils.getSeedId(seed);
    const spath = SeedUtils.seed2Path({ wsRoot, id });
    fs.ensureDirSync(path.dirname(spath));
    const git = simpleGit({ baseDir: wsRoot });
    if (branch) {
      await git.clone(seed.repository.url, spath, { "--branch": "dev" });
    } else {
      await git.clone(seed.repository.url, spath);
    }
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
        const config = ws.config;
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
        const vaults = DConfig.getConfig({
          config: ws.config,
          path: "workspace.vaults",
          required: true,
        }) as DVault[];
        const vaultPath = VaultUtils.getRelPath(vaults[0]);
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

  async removeSeed({
    id,
    onUpdatingWorkspace,
    onUpdatedWorkspace,
  }: {
    id: string;
    onUpdatingWorkspace?: () => Promise<void>;
    onUpdatedWorkspace?: () => Promise<void>;
  }): Promise<SeedSvcResp> {
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
    // Folder cleanup must occur before the metadata changes - if the current
    // workspace that is open is the one being modified in addSeedMetadata(), VS
    // Code will reload the current window and the seed cloning may not execute.
    const spath = SeedUtils.seed2Path({ wsRoot: this.wsRoot, id });
    if (fs.pathExistsSync(spath)) {
      fs.removeSync(spath);
    }

    await this.removeSeedMetadata({
      seed: seedOrError,
      onUpdatingWorkspace,
      onUpdatedWorkspace,
    });
    return { data: { seed: seedOrError } };
  }

  async removeSeedMetadata({
    seed,
    onUpdatingWorkspace,
    onUpdatedWorkspace,
  }: {
    seed: SeedConfig;
    onUpdatingWorkspace?: () => Promise<void>;
    onUpdatedWorkspace?: () => Promise<void>;
  }) {
    const ws = new WorkspaceService({ wsRoot: this.wsRoot });

    // remove seed entry
    const config = ws.config;
    delete (config.seeds || {})[SeedUtils.getSeedId(seed)];
    ws.setConfig(config);

    const updateWorkspace =
      WorkspaceUtils.getWorkspaceTypeFromDir(this.wsRoot) ===
      WorkspaceType.CODE;
    await ws.removeVault({
      vault: SeedUtils.seed2Vault({ seed }),
      updateWorkspace,
      onUpdatingWorkspace,
      onUpdatedWorkspace,
    });
  }

  isSeedInWorkspace(id: string): boolean {
    const ws = new WorkspaceService({ wsRoot: this.wsRoot });
    const config = ws.config;
    const vaults = DConfig.getConfig({
      config,
      path: "workspace.vaults",
      required: true,
    }) as DVault[];
    return undefined !== vaults.find((vault) => vault.seed === id);
  }

  getSeedsInWorkspace(): string[] {
    const ws = new WorkspaceService({ wsRoot: this.wsRoot });
    const config = ws.config;
    const vaults = DConfig.getConfig({
      config,
      path: "workspace.vaults",
      required: true,
    }) as DVault[];
    return vaults
      .filter((vault) => vault.seed !== undefined)
      .map((vault) => vault.seed!);
  }
}
