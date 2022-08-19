-- CreateTable
CREATE TABLE "notes" (
    "fname" TEXT,
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "vault" TEXT,
    "updated" INTEGER,
    "created" INTEGER,
    "stub" BOOLEAN,
    "anchors" json,
    "desc" TEXT,
    "links" json
);

-- CreateTable
CREATE TABLE "DVault" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "relativePath" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "idx_notes_id" ON "notes"("id");
