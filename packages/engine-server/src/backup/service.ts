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

  /**
   * returns backup root path.
   */
  get backupRoot(): string {
    return path.join(this.wsRoot, BACKUP_DIR_NAME);
  }

  /**
   * Makes sure the backup root and directory for each defined key exists.
   * Creates one otherwise.
   * Add to gitignore if not already.
   */
  async ensureBackupDir(): Promise<void> {
    this.logger.info({ msg: "ensureBackupDir" });
    await GitUtils.addToGitignore({
      addPath: BACKUP_DIR_NAME,
      root: this.wsRoot,
    });
    fs.ensureDirSync(this.backupRoot);
    Object.keys(BackupKeyEnum).forEach((key) => {
      fs.ensureDirSync(path.join(this.backupRoot, key));
    });
  }

  /**
   * Given some options and a file name, generate a new file name to use for the backup.
   * @param fileName file name to generate backup name for. Assumes existence of extension.
   * @param timestamp flag to enable adding timestamp to name.
   * @param infix optional custom infix to append right before the extension.
   * @returns generated backup file name.
   */
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

  /**
   *
   * @param key key to use for backup.
   * @param pathToBackup path of file to back up.
   * @param timestamp flag to enable timestamp in backup file name.
   * @param infix optional custom infix to append right before the extension.
   * @returns
   */
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
    this.logger.info({ msg: "creating backup", backupPath, pathToBackup });
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

  /**
   *
   * @param key backup key to use.
   * @returns list of backups with given key.
   */
  getBackupsWithKey(opts: { key: string }): string[] {
    const { key } = opts;
    const backupDir = path.join(this.backupRoot, key);
    try {
      const backupsWithKey = fs.readdirSync(backupDir, { withFileTypes: true });
      // filter out any possible symbolic links and directories
      return backupsWithKey
        .filter((dirent) => dirent.isFile)
        .map((dirent) => dirent.name);
    } catch (error) {
      return [];
    }
  }

  /**
   *
   * @returns all backups grouped by backup key.
   */
  getAllBackups() {
    return Object.keys(BackupKeyEnum).map((key) => {
      return {
        key,
        backups: this.getBackupsWithKey({ key }),
      };
    });
  }
}
