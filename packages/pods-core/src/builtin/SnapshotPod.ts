import {
  ExportCleanConfig,
  ExportConfig,
  ExportPod,
  ExportPodBaseV3,
  ExportPodOpts,
  PodConfigEntry,
} from "../base";
import fs, { pathExistsSync } from "fs-extra";
import path from "path";
import { DVault, Time } from "@dendronhq/common-all";
import { URI } from "vscode-uri";
import _ from "lodash";
import { DUtils } from "@dendronhq/common-all";

const ID = "dendron.snapshot";

function genVaultId(vaultPath: string) {
  return path.basename(vaultPath);
}

type SnapshotExportPodConfig = ExportConfig & {
  ignore?: string;
};
type SnapshotExportPodCleanConfig = ExportCleanConfig & {
  ignore: string[];
};
type SnapshotExportPodOpts = ExportPodOpts<SnapshotExportPodConfig>;

export class SnapshotExportPod extends ExportPodBaseV3 {
  static id: string = ID;
  static description: string = "export notes to snapshot";

  static config = (): PodConfigEntry[] => {
    return [
      {
        key: "dest",
        description: "where will output be stored",
        type: "string",
        default: "$wsRoot/snapshots",
      },
      {
        key: "ignore",
        description: "what files will be ignored during snapshot",
        type: "string",
        default: ".git",
      },
    ];
  };

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

  cleanConfig(config: SnapshotExportPodConfig): SnapshotExportPodCleanConfig {
    const cleanConfig = _.defaults(super.cleanConfig(config), {
      ignore: ".git",
    }) as any;
    cleanConfig.ignore = _.reject(cleanConfig.ignore.split(","), (ent) =>
      _.isEmpty(ent)
    );
    return cleanConfig;
  }

  async plant(opts: SnapshotExportPodOpts): Promise<any> {
    await this.initEngine();
    const cleanConfig = this.cleanConfig(opts.config);
    const { ignore } = cleanConfig;
    // const payload = this.prepareForExport(opts);

    // verify snapshot root
    const snapshotRoot = cleanConfig.dest.fsPath;
    fs.ensureDirSync(snapshotRoot);

    // create snapshot folder
    const snapshotDirId = Time.now().toMillis().toString();
    const snapshotDirPath = path.join(snapshotRoot, snapshotDirId);
    fs.ensureDirSync(snapshotDirPath);

    await Promise.all(
      this.opts.vaults.map((ent) => {
        return this.backupVault({
          vault: { fsPath: ent },
          snapshotDirPath,
          ignore,
        });
      })
    );
    return { snapshotDirPath };
  }
}
