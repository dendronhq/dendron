import {
  DVault,
  NoteUtilsV2,
  SchemaUtilsV2,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  note2File,
  resolvePath,
  schemaModuleOpts2File,
  tmpDir,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { PreSetupHookFunctionV4 } from "./types";
export * from "./fileUtils";
export * from "./noteUtils";
export * from "./presets";
export * from "./types";
export * from "./utils";
export * from "./utilsv2";

type InitVaultFunc = (vaultPath: string) => void;
export type SetupVaultOpts = {
  vaultDir?: string;
  initDirCb?: (vaultPath: string) => void;
  withAssets?: boolean;
  withGit?: boolean;
};
export type SetupWSOpts = {
  initDirCb?: (vaultPath: string) => void;
  withAssets?: boolean;
  withGit?: boolean;
  wsRoot?: string;
  vaultDir?: string;
};

type SetupVaultsOptsV3 = Omit<SetupVaultOpts, "initDirCb"> & {
  vaults?: DVault[];
  initVault1?: InitVaultFunc;
  initVault2?: InitVaultFunc;
};

type SetupWSOptsV3 = SetupVaultsOptsV3 & { wsRoot?: string };

/**
 * Relative vaults
 */

export type SetupVaultsOptsV4 = {
  preSetupHook?: PreSetupHookFunctionV4;
  vault: DVault;
};

export class EngineTestUtilsV4 {
  static async setupWS(
    opts?: { wsRoot?: string } & { setupVaultsOpts?: SetupVaultsOptsV4[] }
  ): Promise<WorkspaceOpts> {
    const wsRoot = opts?.wsRoot || tmpDir().name;
    const setupVaultsOpts: SetupVaultsOptsV4[] =
      opts?.setupVaultsOpts ||
      ["vault1", "vault2"].map((ent) => ({
        vault: { fsPath: ent },
        preSetupHook: async ({ vpath, vault, wsRoot }) => {
          const rootModule = SchemaUtilsV2.createRootModule({
            created: "1",
            updated: "1",
            vault,
          });
          await schemaModuleOpts2File(rootModule, vpath, "root");

          const rootNote = await NoteUtilsV2.createRoot({
            created: "1",
            updated: "1",
            vault,
          });
          await note2File({ note: rootNote, vault, wsRoot });
        },
      }));

    const vaults = await Promise.all(
      setupVaultsOpts.flatMap((ent) => {
        return this.setupVault({ ...ent, wsRoot });
      })
    );
    return { wsRoot, vaults };
  }

  static async setupVault(opts: SetupVaultsOptsV4 & { wsRoot: string }) {
    const { wsRoot, vault } = opts;
    const vpath = resolvePath(vault.fsPath, wsRoot);
    fs.ensureDirSync(vpath);
    if (opts.preSetupHook) {
      await opts.preSetupHook({ wsRoot, vault, vpath });
    }
    return opts.vault;
  }
}

/**
 * Legacy Multi-vault setup
 */
export class EngineTestUtilsV3 {
  static async setupWS(opts: SetupWSOptsV3) {
    const wsRoot = tmpDir().name;
    const vaults = await this.setupVaults(opts);
    return { wsRoot, vaults };
  }

  static async setupVaults(opts: SetupVaultsOptsV3) {
    const { vaults } = _.defaults(opts, {
      vaults: [
        {
          fsPath: tmpDir().name,
          name: "main",
        },
        {
          fsPath: tmpDir().name,
          name: "other",
        },
      ],
    });
    const cb = [opts.initVault1, opts.initVault2];
    await Promise.all(
      vaults.map(async (ent, idx) => {
        const { fsPath: vaultDir } = ent;
        return EngineTestUtilsV2.setupVault({
          ...opts,
          vaultDir,
          initDirCb: cb[idx],
        });
      })
    );
    return vaults;
  }
}

export class EngineTestUtilsV2 {
  static async setupWS(opts: SetupWSOpts) {
    const { initDirCb, withAssets, withGit } = _.defaults(opts, {
      withAssets: true,
      withGit: true,
    });
    let wsRoot = opts.wsRoot ? opts.wsRoot : tmpDir().name;
    let vaultDir = opts.vaultDir ? opts.vaultDir : path.join(wsRoot, "vault");
    await fs.ensureDir(vaultDir);
    await EngineTestUtilsV2.setupVault({
      vaultDir,
      initDirCb,
      withAssets,
      withGit,
    });
    let vaults = [vaultDir];
    return {
      wsRoot,
      vaults,
    };
  }
  static async setupVault(opts: SetupVaultOpts): Promise<string> {
    const { withAssets, withGit } = opts;
    let vaultDir = opts.vaultDir ? opts.vaultDir : tmpDir().name;
    if (opts?.initDirCb) {
      await opts.initDirCb(vaultDir);
    }
    if (withAssets) {
      const assetsDir = path.join(vaultDir, "assets");
      await fs.ensureDir(assetsDir);
      await fs.ensureFile(path.join(assetsDir, "foo.jpg"));
    }
    if (withGit) {
      fs.ensureDirSync(path.join(vaultDir, ".git"));
    }
    return vaultDir;
  }
}
