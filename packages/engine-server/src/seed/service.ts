import {
  assertUnreachable,
  CONSTANTS,
  SeedConfig,
  VaultUtils,
} from "@dendronhq/common-all";
import { writeYAML } from "@dendronhq/common-server";
import path from "path";
import { WorkspaceService } from "../workspace";
import { SeedUtils } from "./utils";

export enum SeedInitMode {
  CREATE_WORKSPACE = "create_workspace",
  CONVERT_WORKSPACE = "convert_workspace",
}

export class SeedService {
  constructor(public wsRoot: string) {}

  async addSeed({ seed, wsRoot }: { seed: SeedConfig; wsRoot: string }) {
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
      writeConfig: false,
    });
    return config;
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
}
