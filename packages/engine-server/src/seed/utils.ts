import {
  ConfigUtils,
  DendronError,
  ERROR_STATUS,
  IntermediateDendronConfig,
  SeedConfig,
  SeedVault,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DConfig } from "../config";
import { WorkspaceService } from "../workspace";
import { DEFAULT_SEED_PUBLISHER } from "./constants";

export class SeedUtils {
  static exists({ id, wsRoot }: { id: string; wsRoot: string }) {
    const seedPath = this.seed2Path({ id, wsRoot });
    return fs.pathExists(seedPath);
  }

  static genDefaultConfig(opts: {
    id: string;
    seed?: SeedConfig;
    name: string;
  }): SeedConfig {
    return _.defaults(opts.seed || {}, {
      id: opts.id,
      name: opts.name,
      publisher: DEFAULT_SEED_PUBLISHER,
      description: "a seed waiting to sprout",
      license: "CC BY 4.0",
      repository: {
        type: "git" as const,
        url: "",
      },
      root: "vault",
    });
  }

  static getSeedId({ publisher, name }: { publisher: string; name: string }) {
    return `${publisher}.${name}`;
  }

  /**
   * Path for seed
   * @param wsRoot - workspace root
   * @param id - id of seed
   * @returns
   */
  static seed2Path({ wsRoot, id }: { wsRoot: string; id: string }) {
    return path.join(wsRoot, "seeds", id);
  }

  static async seed2Vault({
    seed,
    wsRoot,
  }: {
    seed: SeedConfig;
    wsRoot: string;
  }): Promise<SeedVault> {
    const id = this.getSeedId(seed);
    const seedPath = this.seed2Path({ id: seed.id, wsRoot });
    try {
      // The fsPath for a seed vault is the fsPath of the first (and typically only) vault in that workspace
      const seedConfig = DConfig.getRaw(seedPath) as IntermediateDendronConfig;
      const vaults = ConfigUtils.getVaults(seedConfig);

      return {
        fsPath: vaults[0].fsPath,
        seed: id,
        name: id,
      };
    } catch (error) {
      // We can't recover from this, but rethrow with more context
      throw DendronError.createPlainError({
        message: "Unable to read the seed vault configuration",
        payload: {
          error,
          id,
          seedPath,
        },
      });
    }
  }

  static validateWorkspaceSeedConversion({ wsRoot }: { wsRoot: string }) {
    const config = WorkspaceService.getOrCreateConfig(wsRoot);
    const vaults = ConfigUtils.getVaults(config);
    if (vaults.length !== 1) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: `workspace must have exactly one vault. found ${JSON.stringify(
            vaults
          )}`,
        }),
      };
    }
    const workspaces = ConfigUtils.getWorkspace(config).workspaces;
    if (!_.isEmpty(workspaces)) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: "workspace vaults not supported",
        }),
      };
    }
    return {
      error: undefined,
    };
  }
}
