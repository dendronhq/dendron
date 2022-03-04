import {
  DendronError,
  Disposable,
  ERROR_STATUS,
  RespV3,
  Time,
} from "@dendronhq/common-all";
import {
  createDisposableLogger,
  DLogger,
  GitUtils,
} from "@dendronhq/common-server";
import path from "path";
import fs from "fs-extra";
import { IBackupService } from "./backupServiceInterface";

export type BackupServiceOpts = {
  wsRoot: string;
};

export enum BackupKeyEnum {
  config = "config",
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

  async ensureBackupDir(): Promise<void> {
    await GitUtils.addToGitignore({
      addPath: BACKUP_DIR_NAME,
      root: this.wsRoot,
    });
    fs.ensureDirSync(this.backupRoot);
    Object.keys(BackupKeyEnum).forEach((key) => {
      fs.ensureDirSync(path.join(this.backupRoot, key));
    });
  }

  generateBackupFileName(opts: {
    fileName: string;
    timestamp?: boolean;
    infix?: string;
  }): string {
    const { fileName, timestamp, infix } = opts;
    const now = Time.now().toFormat("yyyy.MM.dd.HHmmssS");
    const fileNameSplit = fileName.split(".");
    const extension = fileNameSplit.pop();
    let out = fileNameSplit.join(".");
    if (timestamp) out = `${out}.${now}`;
    if (infix) out = `${out}.${infix}`;
    return `${out}.${extension}`;
  }

  async backup(opts: {
    key: BackupKeyEnum;
    pathToBackup: string;
    timestamp?: boolean;
    infix?: string;
  }): Promise<RespV3<string>> {
    const { key, pathToBackup, timestamp, infix } = opts;
    const backupDir = path.join(this.backupRoot, key);
    const fileName = path.basename(pathToBackup);
    const backupPath = path.join(
      backupDir,
      this.generateBackupFileName({ fileName, timestamp, infix })
    );
    await this.ensureBackupDir();
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

  getBackupsWithKey(opts: { key: string }): string[] {
    const { key } = opts;
    const backupDir = path.join(this.backupRoot, key);
    const backupsWithKey = fs.readdirSync(backupDir, { withFileTypes: true });
    // filter out any possible symbolic links and directories
    return backupsWithKey
      .filter((dirent) => dirent.isFile)
      .map((dirent) => dirent.name);
  }

  getAllBackups() {
    return Object.keys(BackupKeyEnum).map((key) => {
      return {
        key,
        backups: this.getBackupsWithKey({ key }),
      };
    });
  }
}
