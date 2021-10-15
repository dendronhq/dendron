import {
  DendronError,
  DVault,
  ERROR_STATUS,
  SeedConfig,
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

  static seed2Vault({ seed }: { seed: SeedConfig }): DVault {
    const id = this.getSeedId(seed);
    return {
      fsPath: seed.root,
      seed: id,
      name: id,
    };
  }

  static validateWorkspaceSeedConversion({ wsRoot }: { wsRoot: string }) {
    const ws = new WorkspaceService({ wsRoot });
    const config = ws.config;
    const vaults = DConfig.getConfig({
      config,
      path: "workspace.vaults",
      required: true,
    }) as DVault[];
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
    if (!_.isEmpty(ws.config.workspaces)) {
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
