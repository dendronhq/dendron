import { DUtils, DVault, Time } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import {
  ExportPod,
  ExportPodPlantOpts,
  ImportPod,
  ImportPodPlantOpts,
} from "../basev3";

const ID = "dendron.snapshot";

function genVaultId(vaultPath: string) {
  return path.basename(vaultPath);
}

export type SnapshotExportPodResp = {
  snapshotDirPath: string;
};
export type SnapshotExportPodPlantOpts = ExportPodPlantOpts;

export class SnapshotExportPod extends ExportPod {
  static id: string = ID;
  static description: string = "export notes to snapshot";

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

  async plant(opts: SnapshotExportPodPlantOpts) {
    const { vaults, dest } = opts;
    const { ignore } = _.defaults(opts.config, { ignore: ".git" });
    let cIgnore = _.reject(ignore.split(","), (ent) => _.isEmpty(ent));
    // const payload = this.prepareForExport(opts);

    // verify snapshot root
    let snapshotRoot = dest.fsPath;
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
          ignore: cIgnore,
        });
      })
    );
    return { notes: [], data: snapshotDirPath };
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
    const { wsRoot, vaults, src } = opts;
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
    return {importedNotes:[]};
  }
}
