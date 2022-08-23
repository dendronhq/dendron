/*
  Warnings:

  - You are about to drop the `notes` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `DVault` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `DVault` table. All the data in the column will be lost.
  - You are about to drop the column `relativePath` on the `DVault` table. All the data in the column will be lost.
  - You are about to drop the column `schemaVersion` on the `DVault` table. All the data in the column will be lost.
  - Added the required column `fsPath` to the `DVault` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wsRoot` to the `DVault` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "idx_notes_id";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "notes";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Note" (
    "fname" TEXT,
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "updated" INTEGER,
    "created" INTEGER,
    "stub" BOOLEAN,
    "dVaultWsRoot" TEXT NOT NULL,
    "dVaultFsPath" TEXT NOT NULL,
    CONSTRAINT "Note_dVaultWsRoot_dVaultFsPath_fkey" FOREIGN KEY ("dVaultWsRoot", "dVaultFsPath") REFERENCES "DVault" ("wsRoot", "fsPath") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workspace" (
    "wsRoot" TEXT NOT NULL PRIMARY KEY,
    "prismaSchemaVersion" INTEGER NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DVault" (
    "name" TEXT,
    "fsPath" TEXT NOT NULL,
    "wsRoot" TEXT NOT NULL,
    CONSTRAINT "DVault_wsRoot_fkey" FOREIGN KEY ("wsRoot") REFERENCES "Workspace" ("wsRoot") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DVault" ("name") SELECT "name" FROM "DVault";
DROP TABLE "DVault";
ALTER TABLE "new_DVault" RENAME TO "DVault";
CREATE UNIQUE INDEX "DVault_wsRoot_fsPath_key" ON "DVault"("wsRoot", "fsPath");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "idx_notes_id" ON "Note"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_wsRoot_key" ON "Workspace"("wsRoot");
