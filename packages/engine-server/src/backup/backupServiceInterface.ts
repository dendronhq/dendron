import { RespV3 } from "@dendronhq/common-all";
import { BackupKeyEnum } from ".";

export interface IBackupService {
  // root directory
  backupRoot: string;

  // create backup root if it doesn't exist, add to gitignore
  ensureBackupDir(): Promise<void>;

  // given the options, generate a basename for the backup file
  generateBackupFileName(opts: {
    fileName: string;
    timestamp?: boolean;
    infix?: string;
  }): string;

  // backup given file
  backup(opts: {
    key: BackupKeyEnum;
    pathToBackup: string;
    timestamp?: boolean;
    infix?: string;
  }): Promise<RespV3<string>>;

  // get a list of backups given the key
  getBackupsWithKey(opts: { key: string }): string[];

  // get all backups.
  getAllBackups(): {
    key: string;
    backups: string[];
  }[];
}
