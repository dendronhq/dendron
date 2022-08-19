/*
  Warnings:

  - You are about to drop the column `dVaultFsPath` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `dVaultWsRoot` on the `Note` table. All the data in the column will be lost.
  - Added the required column `id` to the `DVault` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dVaultId` to the `Note` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DVault" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "fsPath" TEXT NOT NULL,
    "wsRoot" TEXT NOT NULL,
    CONSTRAINT "DVault_wsRoot_fkey" FOREIGN KEY ("wsRoot") REFERENCES "Workspace" ("wsRoot") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DVault" ("fsPath", "name", "wsRoot") SELECT "fsPath", "name", "wsRoot" FROM "DVault";
DROP TABLE "DVault";
ALTER TABLE "new_DVault" RENAME TO "DVault";
CREATE UNIQUE INDEX "DVault_name_key" ON "DVault"("name");
CREATE UNIQUE INDEX "DVault_wsRoot_fsPath_key" ON "DVault"("wsRoot", "fsPath");
CREATE TABLE "new_Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fname" TEXT,
    "title" TEXT,
    "updated" INTEGER,
    "created" INTEGER,
    "stub" BOOLEAN,
    "dVaultId" INTEGER NOT NULL,
    CONSTRAINT "Note_dVaultId_fkey" FOREIGN KEY ("dVaultId") REFERENCES "DVault" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Note" ("created", "fname", "id", "stub", "title", "updated") SELECT "created", "fname", "id", "stub", "title", "updated" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
CREATE INDEX "idx_notes_id" ON "Note"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
