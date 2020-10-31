import { DendronError, DUtils, DVault, Time } from "@dendronhq/common-all";
import { resolvePath } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { URI } from "vscode-uri";
import { ImportConfig, ImportPodBaseV3, ImportPodOpts } from "../base";
import {
  ExportPod,
  ExportPodCleanConfig,
  ExportPodPlantOpts,
  ExportPodRawConfig,
} from "../basev2";

const ID = "dendron.snapshot";

function genVaultId(vaultPath: string) {
  return path.basename(vaultPath);
}

export type SnapshotExportPodRawConfig = ExportPodRawConfig & {
  ignore?: string;
};
export type SnapshotExportPodCleanConfig = ExportPodCleanConfig & {
  ignore: string[];
};
export type SnapshotExportPodResp = {
  snapshotDirPath: string;
};
export type SnapshotExportPodPlantOpts = ExportPodPlantOpts<
  SnapshotExportPodCleanConfig
>;

export class SnapshotExportPod extends ExportPod<
  SnapshotExportPodRawConfig,
  SnapshotExportPodCleanConfig
> {
  static id: string = ID;
  static description: string = "export notes to snapshot";

  get config() {
    return [
      {
        key: "dest",
        description: "where will output be stored",
        type: "string" as const,
        default: "$wsRoot/snapshots",
      },
      {
        key: "ignore",
        description: "what files will be ignored during snapshot",
        type: "string" as const,
        default: ".git",
      },
    ];
  }

  async backupVault({
    vault,
    snapshotDirPath,
    ignore,
  }: {
    vault: DVault;
    snapshotDirPath: string;
    ignore: string[];
  }) {
    const vaultId = genVaultId(vault.fsPath);
    return fs.copy(vault.fsPath, path.join(snapshotDirPath, vaultId), {
      filter: (src) => {
        if (_.isEmpty(ignore)) {
          return true;
        }
        src = _.trimStart(_.replace(src, vault.fsPath, ""), "/");
        return !_.some(ignore, (ent) => {
          return DUtils.minimatch(src, ent);
        });
      },
    });
  }

  async clean({
    config,
    wsRoot,
  }: {
    config: Partial<SnapshotExportPodRawConfig>;
    wsRoot: string;
  }): Promise<SnapshotExportPodCleanConfig> {
    // set dest
    let dest: URI;
    let destPath: string | undefined = config.dest;
    if (_.isUndefined(destPath)) {
      const maybeDest = _.find(this.config, { key: "dest" });
      if (_.isUndefined(maybeDest) || _.isUndefined(maybeDest.default)) {
        throw new DendronError({ msg: "no dest specified" });
      }
      destPath = maybeDest.default;
    }
    dest = URI.file(resolvePath(destPath, wsRoot));
    // set ignore
    const { ignore } = _.defaults(config, { ignore: ".git" });
    let cIgnore = _.reject(ignore.split(","), (ent) => _.isEmpty(ent));
    return {
      dest,
      ignore: cIgnore,
    };
  }

  // cleanConfig(config: SnapshotExportPodConfig): SnapshotExportPodCleanConfig {
  //   const _config = _.defaults(config, { dest: this.sub() });
  //   const cleanConfig = _.defaults(super.cleanConfig(config), {
  //     ignore: ".git",
  //   }) as any;
  //   cleanConfig.ignore = _.reject(cleanConfig.ignore.split(","), (ent) =>
  //     _.isEmpty(ent)
  //   );
  //   return cleanConfig;
  // }

  async plant(
    opts: SnapshotExportPodPlantOpts
  ): Promise<SnapshotExportPodResp> {
    const { config, vaults } = opts;
    const { ignore } = config;
    // const payload = this.prepareForExport(opts);

    // verify snapshot root
    const snapshotRoot = config.dest.fsPath;
    fs.ensureDirSync(snapshotRoot);

    // create snapshot folder
    const snapshotDirId = Time.now().toMillis().toString();
    const snapshotDirPath = path.join(snapshotRoot, snapshotDirId);
    fs.ensureDirSync(snapshotDirPath);

    await Promise.all(
      vaults.map((vault) => {
        return this.backupVault({
          vault,
          snapshotDirPath,
          ignore,
        });
      })
    );
    return { snapshotDirPath };
  }
}

class SnapshotUtils {
  static copy({
    src,
    dst,
    ignore,
  }: {
    src: string;
    dst: string;
    ignore: string[];
  }) {
    return fs.copy(src, dst, {
      filter: (_src: string) => {
        if (_.isEmpty(ignore)) {
          return true;
        }
        _src = _.trimStart(_.replace(_src, src, ""), "/");
        return !_.some(ignore, (ent) => {
          return DUtils.minimatch(_src, ent);
        });
      },
    });
  }
  static snapshotDir2Vault({
    vaults,
    wsRoot,
  }: {
    snapshotDirPath: string;
    vaults: DVault[];
    wsRoot: string;
  }): DVault {
    if (_.isEmpty(vaults)) {
      return { fsPath: path.join(wsRoot, "vault") };
    }
    // TODO: impl for multi-vault
    return vaults[0];
  }
}

type SnapshotImportPodConfig = ImportConfig;

export class SnapshotImportPod extends ImportPodBaseV3<
  SnapshotImportPodConfig
> {
  static id: string = ID;
  static description: string = "import snapshot";

  async restoreVault({
    wsRoot,
    vaults,
    snapshotDirPath,
  }: {
    vaults: DVault[];
    snapshotDirPath: string;
    wsRoot: string;
  }) {
    const vault = SnapshotUtils.snapshotDir2Vault({
      snapshotDirPath,
      vaults,
      wsRoot,
    });
    return SnapshotUtils.copy({
      src: snapshotDirPath,
      dst: vault.fsPath,
      ignore: [".git"],
    });
  }

  cleanConfig(config: SnapshotImportPodConfig) {
    const cleanConfig = super.cleanConfig(config);
    if (!fs.existsSync(config.src)) {
      throw new DendronError({
        friendly: `no snapshot found at ${config.src}`,
      });
    }
    return cleanConfig;
  }

  async plant(opts: ImportPodOpts<SnapshotImportPodConfig>): Promise<void> {
    const cleanConfig = this.cleanConfig(opts.config);
    await this.prepare(opts);
    const { src } = cleanConfig;
    const { wsRoot, vaults: _vaults } = this.opts;
    const vaults = _vaults.map((ent) => ({ fsPath: ent }));

    const vaultSnapshots = fs.readdirSync(src.fsPath);

    await Promise.all(
      vaultSnapshots.map((ent) => {
        return this.restoreVault({
          wsRoot,
          vaults,
          snapshotDirPath: path.join(src.fsPath, ent),
        });
      })
    );
  }
}
