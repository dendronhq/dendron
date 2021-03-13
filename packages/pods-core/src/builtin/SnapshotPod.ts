import { DUtils, DVault, Time } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import {
  ExportPod,
  ExportPodCleanConfig,
  ExportPodCleanOpts,
  ExportPodPlantOpts,
  ExportPodRawConfig,
} from "../basev2";
import { ImportPod, ImportPodPlantOpts } from "../basev3";

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
  SnapshotExportPodCleanConfig,
  SnapshotExportPodResp
> {
  static id: string = ID;
  static description: string = "export notes to snapshot";

  get config() {
    return [
      {
        key: "dest",
        description: "where will output be stored",
        type: "string" as const,
        default: "snapshots",
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
        src = path.relative(vault.fsPath, src);
        return !_.some(ignore, (ent) => {
          return DUtils.minimatch(src, ent);
        });
      },
    });
  }

  async clean(opts: ExportPodCleanOpts<SnapshotExportPodRawConfig>) {
    // set ignore
    const { ignore } = _.defaults(opts.config, { ignore: ".git" });
    let cIgnore = _.reject(ignore.split(","), (ent) => _.isEmpty(ent));
    return {
      ...opts.config,
      ignore: cIgnore,
    };
  }

  async plant(
    opts: SnapshotExportPodPlantOpts
  ): Promise<SnapshotExportPodResp> {
    const { config, vaults } = opts;
    const { ignore } = config;
    // const payload = this.prepareForExport(opts);

    // verify snapshot root
    let snapshotRoot = config.dest.fsPath;
    if (process.platform === "win32" && snapshotRoot[1] === ":") {
      // We're on Windows and the path includes a drive letter; uppercase it.
      snapshotRoot = `${snapshotRoot[0].toUpperCase()}${snapshotRoot.slice(1)}`;
    }
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

export type SnapshotImportPodResp = {
  snapshotDirPath: string;
};

export class SnapshotImportPod extends ImportPod {
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

  async plant(opts: ImportPodPlantOpts) {
    const ctx = "SnapshotImportPod:plant";
    const { config, wsRoot, vaults } = opts;
    const { src } = config;
    const vaultSnapshots = fs.readdirSync(src.fsPath);
    this.L.info({ ctx, src: src.fsPath });

    await Promise.all(
      vaultSnapshots.map((ent) => {
        return this.restoreVault({
          wsRoot,
          vaults,
          snapshotDirPath: path.join(src.fsPath, ent),
        });
      })
    );
    return [];
  }
}
