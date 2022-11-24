import { BackupKeyEnum, BackupService } from "@dendronhq/common-server";
import { runEngineTestV5 } from "../..";
import path from "path";
import fs from "fs-extra";
import { ConfigService, URI } from "@dendronhq/common-all";

describe("GIVEN BackupService", () => {
  test("THEN returns correct backup root", async () => {
    await runEngineTestV5(
      async ({ wsRoot }) => {
        const backupService = new BackupService({ wsRoot });
        try {
          const root = backupService.backupRoot;
          expect(root).toEqual(path.join(wsRoot, ".backup"));
        } finally {
          backupService.dispose();
        }
      },
      {
        expect,
      }
    );
  });

  describe("WHEN backup root doesn't exist", () => {
    test("THEN ensureBackupDir creates one and adds to gitignore", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const backupService = new BackupService({ wsRoot });
          try {
            const root = backupService.backupRoot;
            expect(fs.existsSync(root)).toBeFalsy();

            await backupService.ensureBackupDir();

            expect(fs.existsSync(root)).toBeTruthy();
            const gitignore = path.join(wsRoot, ".gitignore");
            const gitignoreContents = fs.readFileSync(gitignore, {
              encoding: "utf-8",
            });
            expect(gitignoreContents.includes(".backup")).toBeTruthy();
          } finally {
            backupService.dispose();
          }
        },
        {
          expect,
        }
      );
    });

    test("THEN file is backed up successfully", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const backupService = new BackupService({ wsRoot });
          try {
            const root = backupService.backupRoot;
            expect(fs.existsSync(root)).toBeFalsy();

            const configPath = ConfigService.instance().configPath(
              URI.file(wsRoot)
            ).fsPath;
            const backupResp = await backupService.backup({
              key: BackupKeyEnum.config,
              pathToBackup: configPath,
              timestamp: true,
              infix: "migration",
            });

            expect(backupResp.data && fs.existsSync(backupResp.data));
          } finally {
            backupService.dispose();
          }
        },
        {
          expect,
        }
      );
    });

    test("THEN getBackupsWithKey returns an empty string", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const backupService = new BackupService({ wsRoot });

          try {
            const configBackups = backupService.getBackupsWithKey({
              key: BackupKeyEnum.config,
            });

            expect(configBackups).toEqual([]);
          } finally {
            backupService.dispose();
          }
        },
        {
          expect,
        }
      );
    });

    test("THEN getAllBackups returns a list of objects, one for each defined key, with empty list as backup", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const backupService = new BackupService({ wsRoot });
          try {
            const allBackups = backupService.getAllBackups();

            expect(allBackups).toEqual([
              {
                key: BackupKeyEnum.config,
                backups: [],
              },
            ]);
          } finally {
            backupService.dispose();
          }
        },
        {
          expect,
        }
      );
    });
  });

  test("THEN backup file name is created with optional timestamp and custom", async () => {
    await runEngineTestV5(
      async ({ wsRoot }) => {
        const backupService = new BackupService({ wsRoot });
        try {
          const noOptionOut = backupService.generateBackupFileName({
            fileName: "foo.yml",
          });
          expect(noOptionOut).toEqual("foo.yml");

          const timestampOut = backupService.generateBackupFileName({
            fileName: "foo.yml",
            timestamp: true,
          });
          expect(
            /foo\.\d{4}\.\d{2}\.\d{2}\.\d*\.yml$/g.test(timestampOut)
          ).toBeTruthy();

          const infixOut = backupService.generateBackupFileName({
            fileName: "foo.yml",
            infix: "backup",
          });
          expect(infixOut).toEqual("foo.backup.yml");

          const timestampInfixOut = backupService.generateBackupFileName({
            fileName: "foo.yml",
            timestamp: true,
            infix: "backup",
          });
          expect(
            /foo\.\d{4}\.\d{2}\.\d{2}\.\d*\.backup\.yml$/g.test(
              timestampInfixOut
            )
          ).toBeTruthy();
        } finally {
          backupService.dispose();
        }
      },
      {
        expect,
      }
    );
  });
});
