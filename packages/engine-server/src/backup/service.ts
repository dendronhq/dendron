import {
  DendronError,
  Disposable,
  ERROR_STATUS,
  RespV3,
  Time,
} from "@dendronhq/common-all";
import { createDisposableLogger, DLogger } from "@dendronhq/common-server";
import path from "path";
import fs from "fs-extra";
import { IBackupService } from "./backupServiceInterface";

export type BackupServiceOpts = {
  wsRoot: string;
};

export enum BackupKeyEnum {
  CONFIG = "config",
}

export const BACKUP_DIR_NAME = ".backup";

export class BackupService implements Disposable, IBackupService {
  public wsRoot: string;
  public logger: DLogger;
  private loggerDispose: () => any;

  constructor({ wsRoot }: BackupServiceOpts) {
    const { logger, dispose } = createDisposableLogger();
    this.logger = logger;
    this.loggerDispose = dispose;
    this.wsRoot = wsRoot;
  }

  dispose() {
    this.loggerDispose();
  }

  get backupRoot(): string {
    return path.join(this.wsRoot, BACKUP_DIR_NAME);
  }

  generateBackupFileName(opts: { fileName: string }): string {
    const { fileName } = opts;
    const today = Time.now().toFormat("yyyy.MM.dd.HHmmssS");
    const fileNameSplit = fileName.split(".");
    const extension = fileNameSplit.pop();
    return [fileNameSplit.join("."), today, extension].join(".");
  }

  backup(opts: { key: BackupKeyEnum; pathToBackup: string }): RespV3<string> {
    const { key, pathToBackup } = opts;
    const backupDir = path.join(this.backupRoot, key);
    const fileName = path.basename(pathToBackup);
    const backupPath = path.join(
      backupDir,
      this.generateBackupFileName({ fileName })
    );
    fs.copyFileSync(pathToBackup, backupPath);
    if (!fs.existsSync(backupPath)) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.BACKUP_FAILED,
          message: `backup for ${pathToBackup} failed.`,
        }),
      };
    }
    return { data: backupPath };
  }

  getAllBackups() {
    // TODO: return Map<string, string[]>
  }
}
