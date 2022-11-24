import {
  asyncLoop,
  DendronError,
  Disposable,
  DLogger,
  ERROR_STATUS,
  RespV3,
  Time,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";
import { GitUtils } from "../git";
import { createDisposableLogger } from "../logger";
import { IBackupService } from "./backupServiceInterface";

export type BackupServiceOpts = {
  wsRoot: string;
};

/**
 * Predefined keys to be used for backups
 * Loop over values when extracting keys
 * ^6ao9nojre6ai
 */
export enum BackupKeyEnum {
  config = "config",
}

export const BACKUP_DIR_NAME = ".backup";

/**
 * TODO: move to common-all
 */
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

  /**
   * dispose backup service.
   */
  dispose() {
    this.loggerDispose();
  }

  /**
   * getter for backup root path.
   * returns regardless of the existence of the directory.
   */
  get backupRoot(): string {
    return path.join(this.wsRoot, BACKUP_DIR_NAME);
  }

  /**
   * Makes sure the backup root ({@link backupRoot})
   * and directory for each defined key ({@link BackupKeyEnum}) exists.
   * Creates one otherwise.
   * Adds an entry to gitignore of workspace root if it isn't added already.
   */
  async ensureBackupDir(): Promise<void> {
    this.logger.info({ msg: "ensureBackupDir" });
    await GitUtils.addToGitignore({
      addPath: BACKUP_DIR_NAME,
      root: this.wsRoot,
    });
    await fs.ensureDir(this.backupRoot);
    await asyncLoop<string>(Object.values(BackupKeyEnum), (key) => {
      return fs.ensureDir(path.join(this.backupRoot, key));
    });
  }

  /**
   * Given some options and a file name, generate a new file name to use for the backup.
   *
   * The format would be:
   *
   * `{file name without extension}.{yyyy.MM.dd.HHmmssS, if enabled}.{infix, if enabled}.{extension}`
   *
   * e.g.) Given `dendron.yml`, timestamp, and infix `migrate-config`,
   * the resulting backup file name is `dendron.2022.03.14.3239848.migrate-config.yml`
   *
   * Note that with `timestamp: false` and no infix, this will return the same inputted filename.
   *
   * @param opts.fileName file name to generate backup name for. Assumes existence of extension.
   * @param opts.timestamp flag to enable adding timestamp to name.
   * @param opts.infix optional custom infix to append right before the extension.
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
   * Back up {@link opts.pathToBackup} to directory `{@link backupRoot}/{@link opts.key}`
   * with optional {@link opts.timestamp} and {@link opts.infix} in its name.
   * Or use {@link opts.nameOverride} as the backup name.
   *
   * See {@link generateBackupFileName} to see how backup names are generated.
   *
   * @param opts.key key to use for backup.
   * @param opts.pathToBackup path of file to back up.
   * @param opts.timestamp flag to enable timestamp in backup file name.
   * @param opts.infix optional custom infix to append right before the extension.
   * @param opts.nameOverride if given, it will be used instead of calling {@link generateBackupFileName}.
   * @returns A promise of response containing either the path of the backup or a DendronError
   * ^b0jdi7ncbflr
   */
  async backup(opts: {
    key: BackupKeyEnum;
    pathToBackup: string;
    timestamp?: boolean;
    infix?: string;
    nameOverride?: string;
  }): Promise<RespV3<string>> {
    const { key, pathToBackup, timestamp, infix, nameOverride } = opts;
    const backupDir = path.join(this.backupRoot, key);
    const fileName = path.basename(pathToBackup);
    const backupPath =
      nameOverride ||
      path.join(
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
   * Given a {@link opts.key}, return all backups created with this key.
   * @param opts.key backup key to use. One of {@link BackupKeyEnum} as string.
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
   * @returns all backups grouped by backup key defined by {@link BackupKeyEnum}.
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
