import { DendronError, ERROR_STATUS, SeedConfig } from "@dendronhq/common-all";
import { simpleGit } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { WorkspaceService } from "../workspace";
import { DEFAULT_SEED_PUBLISHER } from "./constants";

export class SeedUtils {
  static genDefaultConfig(opts: {
    seed?: SeedConfig;
    name: string;
  }): SeedConfig {
    return _.defaults(opts.seed || {}, {
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

  static async clone({
    wsRoot,
    config,
  }: {
    config: SeedConfig;
    wsRoot: string;
  }) {
    const id = this.getSeedId(config);
    const spath = this.seed2Path({ wsRoot, id });
    fs.ensureDirSync(path.dirname(spath));
    const git = simpleGit({ baseDir: wsRoot });
    await git.clone(config.repository.url, spath);
    return spath;
  }

  static getSeedId({ publisher, name }: { publisher: string; name: string }) {
    return `${publisher}.${name}`;
  }

  static seed2Path({ wsRoot, id }: { wsRoot: string; id: string }) {
    return path.join(wsRoot, "seeds", id);
  }

  static validateWorkspaceSeedConversion({ wsRoot }: { wsRoot: string }) {
    const ws = new WorkspaceService({ wsRoot });
    if (ws.config.vaults.length !== 1) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: "workspace must have exactly one vault",
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
