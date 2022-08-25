import { BackupService, IBackupService } from "@dendronhq/common-server";
import { QuickPickItem, Uri, window, workspace } from "vscode";
import { VSCodeUtils } from "../vsCodeUtils";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
import path from "path";

type OpenBackupCommandOpts = {};

export class OpenBackupCommand extends BasicCommand<
  OpenBackupCommandOpts,
  void
> {
  key = DENDRON_COMMANDS.OPEN_BACKUP.key;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  private async promptBackupEntrySelection(opts: { backups: string[] }) {
    const { backups } = opts;
    const options: QuickPickItem[] = backups.map((backupName) => {
      return {
        label: backupName,
      };
    });
    const selectedBackupName = await VSCodeUtils.showQuickPick(options, {
      title: "Pick which backup file you want to open.",
      ignoreFocusOut: true,
      canPickMany: false,
    });
    return selectedBackupName;
  }

  private async promptBackupKeySelection(opts: {
    allBackups: { key: string; backups: string[] }[];
    backupService: IBackupService;
  }) {
    const { allBackups, backupService } = opts;
    const options: QuickPickItem[] = allBackups
      .filter((keyEntry) => {
        return keyEntry.backups.length > 0;
      })
      .map((keyEntry) => {
        return {
          label: keyEntry.key,
          detail: `${keyEntry.backups.length} backup(s)`,
        };
      });

    if (options.length > 0) {
      const backupKey = await VSCodeUtils.showQuickPick(options, {
        title: "Pick which kind of backup you want to open.",
        ignoreFocusOut: true,
        canPickMany: false,
      });
      if (backupKey) {
        const selected = allBackups.find((keyEntry) => {
          return keyEntry.key === backupKey.label;
        });

        if (selected) {
          const selectedBackupName = await this.promptBackupEntrySelection({
            backups: selected.backups,
          });

          if (selectedBackupName) {
            const backupFile = await workspace.openTextDocument(
              Uri.file(
                path.join(
                  backupService.backupRoot,
                  selected.key,
                  selectedBackupName.label
                )
              )
            );
            await window.showTextDocument(backupFile);
          } else {
            window.showInformationMessage("No backup selected.");
          }
        } else {
          window.showInformationMessage(
            "There are no backups saved for this key."
          );
        }
      }
    } else {
      window.showInformationMessage("There are no backups saved.");
    }
  }

  async execute(opts?: OpenBackupCommandOpts): Promise<void> {
    const ws = this.extension.getDWorkspace();
    const backupService = new BackupService({ wsRoot: ws.wsRoot });
    try {
      const ctx = "execute";
      this.L.info({ ctx, opts });
      const allBackups = backupService.getAllBackups();
      await this.promptBackupKeySelection({ allBackups, backupService });
    } finally {
      backupService.dispose();
    }
  }
}
